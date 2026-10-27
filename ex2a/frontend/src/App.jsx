import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp, ArrowRight, Check, ChefHat, ChevronDown, Clock3, CreditCard,
  LocateFixed, MapPin, Minus, Plus, Search, ShoppingBag, ShoppingCart,
  Sparkles, Star, Truck, Utensils, X, History, CircleCheck, Leaf, Flame,
  ClipboardList, Phone, Bike
} from 'lucide-react';
import { fallbackMenu } from './data/fallbackMenu.js';

const CATEGORIES = ['All', 'South Indian', 'Biryani', 'Chinese', 'Pizza', 'Burgers', 'Drinks'];
const CART_KEY = 'spice-garden-cart-v1';
const ORDERS_KEY = 'spice-garden-orders-v1';
const CUSTOMER_KEY = 'spice-garden-customer-v1';

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function rupees(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value ?? 0);
}

function IconButton({ label, onClick, children, className = '' }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className={`icon-button ${className}`}>{children}</button>;
}

function FoodImage({ item, className = '' }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`food-image ${className}`}>
      {!failed ? <img src={item.image} alt={item.name} loading="lazy" onError={() => setFailed(true)} /> : <div className="image-fallback"><Utensils size={28} /><span>{item.name}</span></div>}
      {item.isPopular && <span className="popular-badge"><Flame size={12} fill="currentColor" /> Popular</span>}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    const handleKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton>
        </div>
        {children}
      </section>
    </div>
  );
}

function MenuCard({ item, quantity, onAdd, onChange }) {
  return (
    <article className="menu-card">
      <FoodImage item={item} />
      <div className="menu-card-body">
        <div className="food-title-row">
          <h3>{item.name}</h3>
          <span className={`veg-mark ${item.isVeg ? '' : 'non-veg'}`} title={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}><span /></span>
        </div>
        <p className="food-description">{item.description}</p>
        <div className="food-meta"><span><Star size={14} fill="currentColor" /> {item.rating.toFixed(1)}</span><span><Clock3 size={14} /> {item.prepTime}</span></div>
        <div className="menu-card-footer">
          <strong className="food-price">{rupees(item.price)}</strong>
          {quantity > 0 ? (
            <div className="quantity-control"><button aria-label={`Remove one ${item.name}`} onClick={() => onChange(item.slug, -1)}><Minus size={15} /></button><span>{quantity}</span><button aria-label={`Add one ${item.name}`} onClick={() => onChange(item.slug, 1)}><Plus size={15} /></button></div>
          ) : <button className="add-button" onClick={() => onAdd(item)}><Plus size={15} /> Add</button>}
        </div>
      </div>
    </article>
  );
}

function App() {
  const [menu, setMenu] = useState(fallbackMenu);
  const [cart, setCart] = useState(() => readStorage(CART_KEY, {}));
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showPopular, setShowPopular] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [apiMode, setApiMode] = useState('checking');
  const [apiNote, setApiNote] = useState('Connecting to the restaurant service…');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [customer, setCustomer] = useState(() => readStorage(CUSTOMER_KEY, { name: '', phone: '', address: '', paymentMethod: 'Cash on Delivery', notes: '' }));
  const [orders, setOrders] = useState(() => readStorage(ORDERS_KEY, []));

  useEffect(() => {
    let active = true;
    async function loadMenu() {
      try {
        const [healthResponse, menuResponse] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/menu')
        ]);
        const health = await healthResponse.json().catch(() => ({}));
        const payload = await menuResponse.json().catch(() => ({}));
        if (!healthResponse.ok || health.database !== 'connected' || !menuResponse.ok || !Array.isArray(payload.items)) {
          throw new Error('Restaurant API is unavailable. Showing the built-in demo menu.');
        }
        if (active) {
          setMenu(payload.items);
          setApiMode('live');
          setApiNote('Live menu · orders save to MongoDB');
        }
      } catch {
        if (active) {
          setMenu(fallbackMenu);
          setApiMode('demo');
          setApiNote('Demo mode · start MongoDB and the backend to save orders to the database');
        }
      }
    }
    loadMenu();
    return () => { active = false; };
  }, []);

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer)); }, [customer]);

  const visibleMenu = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menu.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      const matchesSearch = !query || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query);
      const matchesPopular = !showPopular || item.isPopular;
      const matchesVeg = !vegOnly || item.isVeg;
      return matchesCategory && matchesSearch && matchesPopular && matchesVeg;
    });
  }, [menu, category, search, showPopular, vegOnly]);

  const cartItems = useMemo(() => Object.entries(cart)
    .filter(([, quantity]) => Number(quantity) > 0)
    .map(([slug, quantity]) => {
      const item = menu.find((entry) => entry.slug === slug) || fallbackMenu.find((entry) => entry.slug === slug);
      return item ? { ...item, quantity: Number(quantity) } : null;
    }).filter(Boolean), [cart, menu]);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= 499 ? 0 : 25;
  const total = subtotal + deliveryFee;
  const amountForFreeDelivery = Math.max(0, 499 - subtotal);

  function addItem(item) {
    setCart((current) => ({ ...current, [item.slug]: (current[item.slug] || 0) + 1 }));
  }

  function changeQuantity(slug, amount) {
    setCart((current) => {
      const next = { ...current };
      const updated = (next[slug] || 0) + amount;
      if (updated <= 0) delete next[slug];
      else next[slug] = Math.min(updated, 50);
      return next;
    });
  }

  function updateCustomer(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function validateCheckout() {
    const name = customer.name.trim();
    const phone = customer.phone.replace(/[\s()-]/g, '');
    if (name.length < 2) return 'Please enter your full name.';
    if (!/^\+?\d{10,13}$/.test(phone)) return 'Enter a valid phone number with 10–13 digits.';
    if (customer.address.trim().length < 8) return 'Please enter your complete delivery address.';
    if (cartItems.length === 0) return 'Your cart is empty. Add a dish before checking out.';
    return '';
  }

  async function placeOrder(event) {
    event.preventDefault();
    setCheckoutError('');
    const validation = validateCheckout();
    if (validation) { setCheckoutError(validation); return; }
    setPlacingOrder(true);

    const input = {
      customer: { name: customer.name.trim(), phone: customer.phone.replace(/[\s()-]/g, ''), address: customer.address.trim() },
      paymentMethod: customer.paymentMethod,
      notes: customer.notes.trim(),
      items: cartItems.map((item) => ({ slug: item.slug, quantity: item.quantity }))
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const data = await response.json().catch(() => ({}));
      if (response.status >= 500 || response.status === 404 || response.status === 502) {
        throw new TypeError(data.message || 'Backend is unavailable');
      }
      if (!response.ok) {
        setCheckoutError(data.message || 'Your order could not be placed. Please check your details.');
        setPlacingOrder(false);
        return;
      }
      const savedOrder = { ...data.order, mode: 'database', createdAt: data.order.createdAt || new Date().toISOString() };
      setOrders((current) => [savedOrder, ...current].slice(0, 20));
      setConfirmation(savedOrder);
      setCart({});
      setCheckoutOpen(false);
    } catch {
      const demoOrder = {
        orderNumber: `DEMO-${Date.now().toString().slice(-8)}`,
        customer: input.customer,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        items: cartItems.map(({ slug, name, price, quantity, image }) => ({ slug, name, price, quantity, image })),
        subtotal,
        deliveryFee,
        total,
        status: 'Order placed (demo)',
        createdAt: new Date().toISOString(),
        mode: 'demo'
      };
      setOrders((current) => [demoOrder, ...current].slice(0, 20));
      setConfirmation(demoOrder);
      setCart({});
      setCheckoutOpen(false);
      setApiMode('demo');
      setApiNote('Demo mode · this order is saved only in this browser, not in MongoDB');
    } finally {
      setPlacingOrder(false);
    }
  }

  const cartSection = (
    <aside className="cart-panel" id="cart-panel">
      <div className="cart-heading"><div className="cart-heading-icon"><ShoppingBag size={19} /></div><div><h2>Your cart</h2><p>{itemCount} {itemCount === 1 ? 'item' : 'items'} selected</p></div></div>
      {cartItems.length === 0 ? (
        <div className="empty-cart"><div className="empty-cart-art"><ShoppingCart size={31} /></div><h3>Your cart is hungry</h3><p>Add something delicious from the menu to get started.</p><button className="text-button" onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}>Explore menu <ArrowRight size={15} /></button></div>
      ) : (
        <>
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div className="cart-line" key={item.slug}>
                <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
                <div className="cart-line-info"><strong>{item.name}</strong><span>{rupees(item.price)} each</span><button className="remove-link" onClick={() => setCart((current) => { const next = { ...current }; delete next[item.slug]; return next; })}>Remove</button></div>
                <div className="cart-line-right"><strong>{rupees(item.price * item.quantity)}</strong><div className="mini-quantity"><button aria-label="Decrease quantity" onClick={() => changeQuantity(item.slug, -1)}><Minus size={12} /></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => changeQuantity(item.slug, 1)}><Plus size={12} /></button></div></div>
              </div>
            ))}
          </div>
          {amountForFreeDelivery > 0 && <div className="free-delivery-hint"><Truck size={16} /><span>Add <strong>{rupees(amountForFreeDelivery)}</strong> more for free delivery</span></div>}
          <div className="bill-summary"><div><span>Subtotal</span><strong>{rupees(subtotal)}</strong></div><div><span>Delivery fee</span><strong>{deliveryFee === 0 ? <span className="free-label">FREE</span> : rupees(deliveryFee)}</strong></div><div className="bill-total"><span>Total</span><strong>{rupees(total)}</strong></div></div>
          <button className="checkout-button" onClick={() => { setCheckoutError(''); setCheckoutOpen(true); }}>Continue to checkout <ArrowRight size={17} /></button>
          <p className="secure-note"><Check size={13} /> No payment is collected online</p>
        </>
      )}
      <div className="cart-help"><div className="help-icon"><Phone size={16} /></div><div><strong>Need a little help?</strong><p>We’re happy to help with your order.</p></div></div>
    </aside>
  );

  return (
    <div className="app-shell">
      <div className="top-strip"><span><Sparkles size={14} /> Good food, good mood</span><span>Serving Erode <span className="strip-dot">•</span> Open today, 10 AM – 10 PM</span></div>
      <header className="main-header">
        <a className="brand" href="#top" aria-label="Spice Garden home" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="brand-mark"><ChefHat size={24} /></span><span className="brand-words"><strong>spice garden</strong><small>RESTAURANT & KITCHEN</small></span>
        </a>
        <nav className="header-nav" aria-label="Main navigation"><button className="nav-active" onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}>Menu</button><button onClick={() => setHistoryOpen(true)}>My orders</button><button onClick={() => document.getElementById('restaurant-info')?.scrollIntoView({ behavior: 'smooth' })}>About us</button></nav>
        <div className="header-actions"><div className="delivery-location"><MapPin size={17} /><span><small>Delivering to</small><strong>Erode, Tamil Nadu</strong></span><ChevronDown size={14} /></div><button className="header-cart" onClick={() => document.getElementById('cart-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><ShoppingCart size={19} /><span>Cart</span>{itemCount > 0 && <b>{itemCount}</b>}</button></div>
      </header>

      <main id="top">
        <section className="hero-wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> FRESH FROM OUR KITCHEN</div>
            <h1>Delicious food.<br /><span>Delivered with love.</span></h1>
            <p>Your favourites, freshly prepared and brought straight to your door. There’s always something delicious waiting for you.</p>
            <div className="hero-perks"><span><Clock3 size={16} /> 30–40 min</span><span><Star size={16} fill="currentColor" /> 4.7 rating</span><span><Truck size={16} /> Free over ₹499</span></div>
            <button className="hero-cta" onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}>Explore the menu <ArrowDownUp size={16} /></button>
          </div>
          <div className="hero-visual"><div className="hero-orange-shape" /><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=90" alt="A freshly prepared meal served at a table" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><div className="hero-rating-card"><span className="rating-star"><Star size={17} fill="currentColor" /></span><span><strong>4.7/5</strong><small>Loved by locals</small></span></div><div className="hero-delivery-card"><span><Bike size={19} /></span><div><strong>Fresh, not fast-frozen</strong><small>Made when you order</small></div></div></div>
        </section>

        <section className="restaurant-summary" id="restaurant-info">
          <div className="restaurant-avatar"><ChefHat size={25} /></div>
          <div className="restaurant-name"><h2>Spice Garden Restaurant</h2><p>South Indian <span>·</span> Chinese <span>·</span> Fast Food</p></div>
          <div className="restaurant-stat"><Star size={17} fill="currentColor" /><strong>4.7</strong><span>rating</span></div>
          <div className="restaurant-stat"><Clock3 size={17} /><strong>30–40</strong><span>mins</span></div>
          <div className="restaurant-stat"><MapPin size={17} /><strong>Erode</strong><span>Tamil Nadu</span></div>
        </section>

        {apiMode !== 'live' && <div className={`api-banner ${apiMode === 'demo' ? 'api-demo' : ''}`}><span className="api-dot" /> <span>{apiNote}</span>{apiMode === 'demo' && <button onClick={() => window.location.reload()}>Retry connection</button>}</div>}

        <div className="content-layout" id="menu-section">
          <section className="menu-column">
            <div className="section-title-row"><div><span className="section-kicker">FROM OUR MENU</span><h2>Find your next favourite</h2><p>Freshly made, full of flavour, just for you.</p></div><div className="menu-sort-label"><Sparkles size={15} /> Made fresh to order</div></div>
            <div className="menu-tools"><div className="search-field"><Search size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dishes, ingredients…" aria-label="Search menu" />{search && <IconButton label="Clear search" onClick={() => setSearch('')}><X size={15} /></IconButton>}</div><button className={`filter-chip ${showPopular ? 'selected' : ''}`} onClick={() => setShowPopular((current) => !current)}><Flame size={15} /> Popular</button><button className={`filter-chip veg-filter ${vegOnly ? 'selected' : ''}`} onClick={() => setVegOnly((current) => !current)}><Leaf size={15} /> Veg only</button></div>
            <div className="category-scroller" role="tablist" aria-label="Food categories">{CATEGORIES.map((item) => <button role="tab" aria-selected={category === item} key={item} className={`category-pill ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
            <div className="dish-count-row"><span>{visibleMenu.length} delicious {visibleMenu.length === 1 ? 'dish' : 'dishes'}</span><span>Prices in INR <span className="count-dot">·</span> Inclusive of all listed items</span></div>
            {visibleMenu.length > 0 ? <div className="menu-grid">{visibleMenu.map((item) => <MenuCard key={item.slug} item={item} quantity={cart[item.slug] || 0} onAdd={addItem} onChange={changeQuantity} />)}</div> : <div className="empty-results"><div><Search size={25} /></div><h3>No dishes found</h3><p>Try another search or choose a different category.</p><button className="text-button" onClick={() => { setSearch(''); setCategory('All'); setShowPopular(false); setVegOnly(false); }}>Clear filters <ArrowRight size={15} /></button></div>}
            <div className="fresh-note"><div className="fresh-note-icon"><ChefHat size={20} /></div><div><strong>Prepared fresh, every single time</strong><p>We start cooking after you order, so your food reaches you warm and full of flavour.</p></div><span className="fresh-sparkle"><Sparkles size={20} /></span></div>
          </section>
          <div className="cart-column">{cartSection}</div>
        </div>

        <section className="bottom-promo"><div className="promo-icon"><Truck size={22} /></div><div><strong>A little treat from us</strong><p>Enjoy free delivery on orders of ₹499 or more.</p></div><button onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}>Order something lovely <ArrowRight size={15} /></button></section>
      </main>

      <footer className="footer"><a className="footer-brand" href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span className="brand-mark small"><ChefHat size={18} /></span><strong>spice garden</strong></a><span>Freshly prepared with care in Erode.</span><span>© {new Date().getFullYear()} Spice Garden Restaurant</span></footer>
      <div className="mobile-cart-bar"><div><span>{itemCount} items</span><strong>{rupees(total)}</strong></div><button onClick={() => itemCount ? setCheckoutOpen(true) : document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}>{itemCount ? 'View cart & checkout' : 'Explore menu'} <ArrowRight size={17} /></button></div>

      {checkoutOpen && <Modal title="Delivery details" subtitle="Where should we bring your freshly prepared food?" onClose={() => setCheckoutOpen(false)}>
        <form className="checkout-form" onSubmit={placeOrder}>
          <div className="checkout-order-preview"><div className="preview-icon"><ShoppingBag size={18} /></div><div><strong>{itemCount} {itemCount === 1 ? 'item' : 'items'} in your order</strong><span>Order total including delivery</span></div><strong className="preview-total">{rupees(total)}</strong></div>
          <label>Full name<input required minLength="2" maxLength="80" autoComplete="name" value={customer.name} onChange={(event) => updateCustomer('name', event.target.value)} placeholder="Enter your name" /></label>
          <label>Phone number<div className="input-with-prefix"><span>+91</span><input required inputMode="tel" autoComplete="tel-national" value={customer.phone} onChange={(event) => updateCustomer('phone', event.target.value)} placeholder="10-digit mobile number" /></div></label>
          <label>Delivery address<textarea required minLength="8" maxLength="300" autoComplete="street-address" value={customer.address} onChange={(event) => updateCustomer('address', event.target.value)} placeholder="Door no., street, area and landmark" rows="3" /></label>
          <label>Payment method<select value={customer.paymentMethod} onChange={(event) => updateCustomer('paymentMethod', event.target.value)}><option>Cash on Delivery</option><option>UPI on Delivery</option></select></label>
          <label>Cooking / delivery note <span className="optional-label">Optional</span><input maxLength="300" value={customer.notes} onChange={(event) => updateCustomer('notes', event.target.value)} placeholder="e.g. Less spicy, call on arrival" /></label>
          {checkoutError && <div className="form-error" role="alert">{checkoutError}</div>}
          <div className="checkout-disclaimer"><CreditCard size={16} /><span>Payment is collected on delivery. This student project does not process online payments.</span></div>
          <button type="submit" className="place-order-button" disabled={placingOrder}>{placingOrder ? <><span className="button-spinner" /> Placing your order…</> : <>Place order <span>{rupees(total)}</span></>}</button>
        </form>
      </Modal>}

      {confirmation && <Modal title="Order confirmed!" subtitle={confirmation.mode === 'demo' ? 'Your demo order is saved in this browser.' : 'The restaurant has received your order.'} onClose={() => setConfirmation(null)} wide>
        <div className="confirmation-content"><div className="confirmation-success"><CircleCheck size={42} /></div><h3>Thank you, {confirmation.customer?.name?.split(' ')[0] || 'there'}!</h3><p className="confirmation-description">{confirmation.mode === 'demo' ? 'Demo mode was used because the backend could not be reached. This order has not been saved to MongoDB.' : 'Your order has been placed successfully. Our kitchen will begin preparing it shortly.'}</p><div className={`order-mode-notice ${confirmation.mode === 'demo' ? 'demo-notice' : ''}`}>{confirmation.mode === 'demo' ? 'DEMO ORDER · LOCAL BROWSER ONLY' : 'SAVED TO RESTAURANT DATABASE'}</div><div className="confirmation-number"><span>Order number</span><strong>{confirmation.orderNumber}</strong></div><div className="confirmation-items">{confirmation.items?.map((item) => <div key={item.slug}><span>{item.quantity} × {item.name}</span><strong>{rupees(item.price * item.quantity)}</strong></div>)}</div><div className="confirmation-total"><span>Total paid on delivery</span><strong>{rupees(confirmation.total)}</strong></div><div className="confirmation-address"><MapPin size={18} /><div><strong>Delivering to</strong><p>{confirmation.customer?.address}</p><span>{confirmation.paymentMethod}</span></div></div><button className="place-order-button done-button" onClick={() => setConfirmation(null)}>Done <Check size={17} /></button></div>
      </Modal>}

      {historyOpen && <Modal title="Your recent orders" subtitle="Orders placed from this browser." onClose={() => setHistoryOpen(false)} wide>
        <div className="order-history-content">{orders.length === 0 ? <div className="history-empty"><div><History size={28} /></div><h3>No orders yet</h3><p>Your placed orders will appear here.</p><button className="text-button" onClick={() => { setHistoryOpen(false); document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' }); }}>Browse the menu <ArrowRight size={15} /></button></div> : orders.map((order) => <article className="history-order" key={order.orderNumber}><div className="history-order-top"><div><span className={`history-status ${order.mode === 'demo' ? 'is-demo' : ''}`}><Check size={12} /> {order.status || 'Order placed'}</span><h3>Order {order.orderNumber}</h3><p>{new Date(order.createdAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></div><strong>{rupees(order.total)}</strong></div><div className="history-foods">{(order.items || []).map((item) => `${item.quantity} × ${item.name}`).join(' · ')}</div>{order.mode === 'demo' && <small className="history-demo-warning">Demo order — stored only in this browser.</small>}</article>)}</div>
      </Modal>}

      <div className="sr-only" aria-live="polite">{apiMode === 'live' ? 'Connected to restaurant service.' : apiMode === 'demo' ? 'Showing demo menu.' : 'Checking restaurant service.'}</div>
    </div>
  );
}

export default App;
