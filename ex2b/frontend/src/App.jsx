import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowDownUp, ArrowRight, BadgeCheck, Check, ChevronDown,
  CircleHelp, Clock3, Edit3, Heart, Leaf, MapPin, Menu, PackagePlus,
  Search, ShieldCheck, SlidersHorizontal, Sparkles, Tag, Trash2, X,
  MessageCircle, Plus, Camera, ShoppingBag, CheckCircle2, UserRound,
  LayoutGrid, Bookmark, Mail, Phone, ArrowUpRight, Recycle
} from 'lucide-react';
import { fallbackListings } from './fallbackListings.js';

const CURRENT_USER_KEY = 'reloop-current-user-v1';
const LOCAL_LISTINGS_KEY = 'reloop-demo-listings-v1';
const SAVED_KEY = 'reloop-saved-listings-v1';
const INQUIRIES_KEY = 'reloop-demo-inquiries-v1';
const CATEGORIES = ['All', 'Electronics', 'Study Essentials', 'Home & Living', 'Fashion', 'Sports', 'Other'];
const CONDITIONS = ['Like New', 'Excellent', 'Good', 'Fair'];

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable in private browsing. */ }
}

function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function shortDate(value) {
  if (!value) return 'Recently listed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently listed';
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return 'Listed today';
  if (days === 1) return 'Listed yesterday';
  if (days < 7) return `Listed ${days} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function safeId() {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function IconButton({ label, onClick, children, className = '' }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} type="button" onClick={onClick}>{children}</button>;
}

function ImageView({ listing, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [listing.image]);
  return (
    <div className={`listing-image ${className}`}>
      {listing.image && !failed
        ? <img src={listing.image} alt={listing.title} loading="lazy" onError={() => setFailed(true)} />
        : <div className={`image-placeholder category-${String(listing.category || 'other').toLowerCase().replace(/[^a-z]+/g, '-')}`}><ShoppingBag size={34} /><span>{listing.category || 'Pre-loved find'}</span></div>}
      {listing.featured && <span className="featured-label"><Sparkles size={12} /> Featured</span>}
    </div>
  );
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()} role="presentation">
      <section className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <IconButton label="Close dialog" onClick={onClose}><X size={19} /></IconButton>
        </div>
        {children}
      </section>
    </div>
  );
}

function ListingCard({ listing, isSaved, isOwner, onOpen, onSave, onEdit, onDelete }) {
  const discount = listing.originalPrice > listing.price ? Math.round((1 - listing.price / listing.originalPrice) * 100) : 0;
  return (
    <article className="listing-card">
      <button className="card-image-button" type="button" onClick={() => onOpen(listing)} aria-label={`View ${listing.title}`}>
        <ImageView listing={listing} />
      </button>
      <button className={`save-button ${isSaved ? 'is-saved' : ''}`} type="button" onClick={(event) => { event.stopPropagation(); onSave(listing._id); }} aria-label={isSaved ? 'Remove from saved items' : 'Save item'} title={isSaved ? 'Remove saved item' : 'Save item'}>
        <Heart size={17} fill={isSaved ? 'currentColor' : 'none'} />
      </button>
      <div className="listing-body">
        <div className="listing-overline"><span className="category-label">{listing.category}</span><span className="condition-label">{listing.condition}</span></div>
        <button type="button" className="listing-title-button" onClick={() => onOpen(listing)}><h3>{listing.title}</h3></button>
        <p className="listing-description">{listing.description}</p>
        <div className="listing-location"><MapPin size={13} /><span>{listing.location}</span><span className="dot-separator">·</span><span>{shortDate(listing.createdAt)}</span></div>
        <div className="listing-price-row">
          <div className="price-stack"><strong>{money(listing.price)}</strong>{listing.originalPrice > listing.price && <span>{money(listing.originalPrice)}</span>}</div>
          {discount > 0 && <span className="discount-badge">{discount}% off</span>}
        </div>
        {isOwner && <div className="owner-actions"><span><UserRound size={13} /> Your listing</span><div><IconButton label="Edit listing" onClick={() => onEdit(listing)}><Edit3 size={15} /></IconButton><IconButton label="Delete listing" onClick={() => onDelete(listing)}><Trash2 size={15} /></IconButton></div></div>}
        <button className="view-item-button" type="button" onClick={() => onOpen(listing)}>View item <ArrowRight size={15} /></button>
      </div>
    </article>
  );
}

const EMPTY_FORM = {
  title: '', description: '', category: 'Electronics', price: '', originalPrice: '',
  condition: 'Good', image: '', location: 'Erode, Tamil Nadu', sellerName: 'Kamali', sellerContact: '', featured: false, status: 'Available'
};

function ListingForm({ initial, currentUser, onClose, onSubmit, busy }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, sellerName: currentUser, ...(initial || {}) }));
  const [error, setError] = useState('');
  function change(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function submit(event) {
    event.preventDefault();
    setError('');
    if (form.title.trim().length < 3) return setError('Enter a product name with at least 3 characters.');
    if (form.description.trim().length < 10) return setError('Add a description of at least 10 characters.');
    if (!form.price || Number(form.price) < 1) return setError('Enter a valid asking price.');
    if (form.location.trim().length < 2) return setError('Enter the item location.');
    if (form.sellerName.trim().length < 2) return setError('Enter your seller name.');
    if (form.sellerContact.trim().length < 5) return setError('Enter your phone number or email.');
    if (form.image.trim() && !/^(https?:\/\/|data:image\/)/i.test(form.image.trim())) return setError('Image must be a URL beginning with http:// or https://.');
    onSubmit({ ...form, title: form.title.trim(), description: form.description.trim(), price: Number(form.price), originalPrice: form.originalPrice === '' ? null : Number(form.originalPrice), sellerName: form.sellerName.trim(), sellerContact: form.sellerContact.trim(), location: form.location.trim(), image: form.image.trim() });
  }
  return (
    <Modal title={initial ? 'Edit your listing' : 'List an item'} subtitle={initial ? 'Keep the details accurate for potential buyers.' : 'Give a pre-loved item a second life.'} onClose={onClose} wide>
      <form className="form-content" onSubmit={submit}>
        <div className="form-grid">
          <label className="field full-field">Product name *<input value={form.title} maxLength={90} onChange={(e) => change('title', e.target.value)} placeholder="e.g. Wireless headphones" /></label>
          <label className="field">Category *<select value={form.category} onChange={(e) => change('category', e.target.value)}>{CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field">Condition *<select value={form.condition} onChange={(e) => change('condition', e.target.value)}>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field">Asking price (₹) *<input type="number" min="1" max="10000000" value={form.price} onChange={(e) => change('price', e.target.value)} placeholder="1200" /></label>
          <label className="field">Original price (₹)<input type="number" min="0" max="10000000" value={form.originalPrice ?? ''} onChange={(e) => change('originalPrice', e.target.value)} placeholder="Optional" /></label>
          <label className="field full-field">Description *<textarea rows="3" maxLength={1200} value={form.description} onChange={(e) => change('description', e.target.value)} placeholder="Describe the condition, features and anything the buyer should know." /><span className="field-hint">{form.description.length}/1200 characters</span></label>
          <label className="field full-field">Image URL <input value={form.image} onChange={(e) => change('image', e.target.value)} placeholder="https://example.com/product-photo.jpg" /><span className="field-hint">Use a publicly accessible image URL. This field is optional.</span></label>
          <label className="field">Pickup location *<input value={form.location} onChange={(e) => change('location', e.target.value)} placeholder="Erode, Tamil Nadu" /></label>
          <label className="field">Seller name *<input value={form.sellerName} onChange={(e) => change('sellerName', e.target.value)} placeholder="Your name" /></label>
          <label className="field full-field">Contact (phone or email) *<input value={form.sellerContact} onChange={(e) => change('sellerContact', e.target.value)} placeholder="Your contact details" /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : <><PackagePlus size={17} /> Publish listing</>}</button></div>
      </form>
    </Modal>
  );
}

function InquiryForm({ listing, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({ buyerName: '', buyerPhone: '', buyerLocation: '', message: `Hi, I'm interested in ${listing.title}. Is it still available?` });
  const [error, setError] = useState('');
  function change(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function submit(event) {
    event.preventDefault(); setError('');
    if (form.buyerName.trim().length < 2) return setError('Please enter your name.');
    if (!/^\+?[0-9\s()-]{10,18}$/.test(form.buyerPhone.trim())) return setError('Please enter a valid phone number.');
    if (form.buyerLocation.trim().length < 2) return setError('Please enter your location.');
    onSubmit({ ...form, buyerName: form.buyerName.trim(), buyerPhone: form.buyerPhone.trim(), buyerLocation: form.buyerLocation.trim(), message: form.message.trim() });
  }
  return (
    <Modal title="Contact the seller" subtitle="Send an enquiry to arrange a safe handover." onClose={onClose}>
      <div className="inquiry-product"><ImageView listing={listing} /><div><span>{listing.condition}</span><h3>{listing.title}</h3><strong>{money(listing.price)}</strong><small>Seller: {listing.sellerName}</small></div></div>
      <form className="form-content" onSubmit={submit}>
        <label className="field">Your name *<input value={form.buyerName} onChange={(e) => change('buyerName', e.target.value)} placeholder="Full name" /></label>
        <label className="field">Phone number *<input value={form.buyerPhone} onChange={(e) => change('buyerPhone', e.target.value)} inputMode="tel" placeholder="10-digit phone number" /></label>
        <label className="field">Your location *<input value={form.buyerLocation} onChange={(e) => change('buyerLocation', e.target.value)} placeholder="City or neighbourhood" /></label>
        <label className="field">Message to seller<textarea rows="3" maxLength={500} value={form.message} onChange={(e) => change('message', e.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="privacy-note"><ShieldCheck size={16} /> Your request is for a buyer-seller enquiry only. No payment is collected.</div>
        <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Sending…' : <><MessageCircle size={16} /> Send enquiry</>}</button></div>
      </form>
    </Modal>
  );
}

function DetailModal({ listing, currentUser, onClose, onSave, isSaved, onInquiry, onEdit, onDelete }) {
  const owner = listing.sellerName?.toLowerCase() === currentUser.toLowerCase();
  return (
    <Modal title="Product details" subtitle="Check the condition and agree on the handover with the seller." onClose={onClose} wide>
      <div className="detail-layout">
        <ImageView listing={listing} className="detail-image" />
        <div className="detail-info">
          <div className="listing-overline"><span className="category-label">{listing.category}</span><span className="condition-label">{listing.condition}</span></div>
          <h2>{listing.title}</h2>
          <div className="detail-price">{money(listing.price)} {listing.originalPrice > listing.price && <del>{money(listing.originalPrice)}</del>}</div>
          <p className="detail-description">{listing.description}</p>
          <div className="detail-facts"><span><MapPin size={16} /> {listing.location}</span><span><Clock3 size={16} /> {shortDate(listing.createdAt)}</span><span><UserRound size={16} /> Listed by {listing.sellerName}</span></div>
          <div className="seller-card"><div className="seller-avatar">{(listing.sellerName || 'S').slice(0, 1).toUpperCase()}</div><div><strong>{listing.sellerName}</strong><span>Community seller</span></div><BadgeCheck size={18} /></div>
          <p className="detail-safety"><ShieldCheck size={16} /> Meet in a public place and inspect the item before paying.</p>
          {owner ? <div className="detail-actions"><button className="button button-outline" onClick={() => onEdit(listing)}><Edit3 size={16} /> Edit listing</button><button className="button button-danger" onClick={() => onDelete(listing)}><Trash2 size={16} /> Remove</button></div> : <div className="detail-actions"><button className={`button button-outline ${isSaved ? 'button-saved' : ''}`} onClick={() => onSave(listing._id)}><Heart size={16} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Save item'}</button><button className="button button-primary" onClick={() => onInquiry(listing)}><MessageCircle size={16} /> I'm interested</button></div>}
        </div>
      </div>
    </Modal>
  );
}

function EmptyState({ title, description, action, onAction }) {
  return <div className="empty-state"><div className="empty-icon"><ShoppingBag size={24} /></div><h3>{title}</h3><p>{description}</p>{action && <button className="button button-primary" onClick={onAction}><Plus size={16} /> {action}</button>}</div>;
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => readStorage(CURRENT_USER_KEY, 'Kamali'));
  const [listings, setListings] = useState(() => readStorage(LOCAL_LISTINGS_KEY, fallbackListings));
  const [savedIds, setSavedIds] = useState(() => readStorage(SAVED_KEY, []));
  const [apiMode, setApiMode] = useState('checking');
  const [apiMessage, setApiMessage] = useState('Checking marketplace service…');
  const [activeView, setActiveView] = useState('browse');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listingModal, setListingModal] = useState(null);
  const [detailListing, setDetailListing] = useState(null);
  const [inquiryListing, setInquiryListing] = useState(null);
  const [successInquiry, setSuccessInquiry] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [toastKind, setToastKind] = useState('success');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadListings() {
      try {
        const healthResponse = await fetch('/api/health');
        const health = await healthResponse.json();
        if (!healthResponse.ok || health.database !== 'connected') throw new Error('API not connected');
        const response = await fetch('/api/listings');
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.listings)) throw new Error('Could not load marketplace listings');
        if (active) {
          setListings(data.listings);
          setApiMode('live');
          setApiMessage('Live marketplace · listings and enquiries save to MongoDB');
        }
      } catch {
        if (active) {
          setListings(readStorage(LOCAL_LISTINGS_KEY, fallbackListings));
          setApiMode('demo');
          setApiMessage('Demo mode · listings save in this browser. Start MongoDB and the backend for database storage.');
        }
      }
    }
    loadListings();
    return () => { active = false; };
  }, []);

  useEffect(() => { writeStorage(LOCAL_LISTINGS_KEY, listings); }, [listings]);
  useEffect(() => { writeStorage(SAVED_KEY, savedIds); }, [savedIds]);
  useEffect(() => { writeStorage(CURRENT_USER_KEY, currentUser); }, [currentUser]);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(''), 3600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const visibleListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = listings.filter((listing) => {
      if (listing.status && listing.status !== 'Available' && !(activeView === 'mine' && listing.sellerName?.toLowerCase() === currentUser.toLowerCase())) return false;
      if (activeView === 'mine' && listing.sellerName?.toLowerCase() !== currentUser.toLowerCase()) return false;
      if (activeView === 'saved' && !savedIds.includes(listing._id)) return false;
      if (category !== 'All' && listing.category !== category) return false;
      if (query && !`${listing.title} ${listing.description} ${listing.category} ${listing.location} ${listing.sellerName}`.toLowerCase().includes(query)) return false;
      if (maxPrice && Number(listing.price) > Number(maxPrice)) return false;
      return true;
    });
    result = [...result];
    if (sort === 'price-low') result.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price-high') result.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'newest') result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    else result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return result;
  }, [listings, search, category, maxPrice, sort, activeView, savedIds, currentUser]);

  function showToast(message, kind = 'success') { setToast(message); setToastKind(kind); }
  function saveToggle(id) {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      showToast(next.includes(id) ? 'Saved to your favourites.' : 'Removed from your saved items.');
      return next;
    });
  }

  async function saveListing(form) {
    setBusy(true);
    try {
      if (apiMode === 'live') {
        const isEdit = Boolean(listingModal?.listing?._id);
        const url = isEdit ? `/api/listings/${listingModal.listing._id}` : '/api/listings';
        const response = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Could not save the listing.');
        if (isEdit) setListings((current) => current.map((item) => item._id === data.listing._id ? data.listing : item));
        else setListings((current) => [data.listing, ...current]);
      } else {
        const isEdit = Boolean(listingModal?.listing?._id);
        if (isEdit) setListings((current) => current.map((item) => item._id === listingModal.listing._id ? { ...item, ...form, updatedAt: new Date().toISOString() } : item));
        else setListings((current) => [{ ...form, _id: safeId(), createdAt: new Date().toISOString(), featured: false, status: 'Available' }, ...current]);
      }
      setListingModal(null);
      setDetailListing(null);
      showToast(listingModal?.listing ? 'Your listing has been updated.' : 'Your item is now listed!');
      setActiveView('mine'); setCategory('All'); setSearch('');
    } catch (error) {
      showToast(error.message || 'Could not save the listing.', 'error');
    } finally { setBusy(false); }
  }

  async function deleteListing(listing) {
    if (!window.confirm(`Remove “${listing.title}” from the marketplace?`)) return;
    try {
      if (apiMode === 'live' && !String(listing._id).startsWith('demo-')) {
        const response = await fetch(`/api/listings/${listing._id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sellerName: currentUser }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Could not remove the listing.');
      }
      setListings((current) => current.filter((item) => item._id !== listing._id));
      setSavedIds((current) => current.filter((id) => id !== listing._id));
      setDetailListing(null);
      showToast('Listing removed.');
    } catch (error) { showToast(error.message || 'Could not remove the listing.', 'error'); }
  }

  async function submitInquiry(form) {
    setBusy(true);
    try {
      let result;
      if (apiMode === 'live' && !String(inquiryListing._id).startsWith('demo-')) {
        const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, listingId: inquiryListing._id }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Could not send the enquiry.');
        result = { ...data.inquiry, listingTitle: inquiryListing.title, sellerName: inquiryListing.sellerName, mode: 'live' };
      } else {
        result = { id: safeId(), listingTitle: inquiryListing.title, sellerName: inquiryListing.sellerName, buyerName: form.buyerName, createdAt: new Date().toISOString(), mode: 'demo' };
        const enquiries = readStorage(INQUIRIES_KEY, []);
        writeStorage(INQUIRIES_KEY, [result, ...enquiries].slice(0, 100));
      }
      setInquiryListing(null); setDetailListing(null); setSuccessInquiry(result);
    } catch (error) { showToast(error.message || 'Could not send the enquiry.', 'error'); }
    finally { setBusy(false); }
  }

  function openNewListing() {
    setListingModal({ mode: 'create', listing: null });
    setMobileNavOpen(false);
  }
  function openEdit(listing) {
    if (listing.sellerName?.toLowerCase() !== currentUser.toLowerCase()) return showToast('You can only edit your own listings.', 'error');
    setDetailListing(null); setListingModal({ mode: 'edit', listing });
  }
  function switchView(view) { setActiveView(view); setMobileNavOpen(false); if (view !== 'browse') { setCategory('All'); setSearch(''); } }
  function changeUser() {
    const name = window.prompt('Enter your demo seller name. Use the same name as your listings to manage them.', currentUser);
    if (name && name.trim().length >= 2) { setCurrentUser(name.trim()); showToast(`Demo profile changed to ${name.trim()}.`); }
  }
  const pageTitle = activeView === 'mine' ? 'My listings' : activeView === 'saved' ? 'Saved finds' : 'Find your next great deal';
  const pageSubtitle = activeView === 'mine' ? 'Manage the pre-loved items you have listed.' : activeView === 'saved' ? 'Your shortlist of things worth a second look.' : 'Good finds, fair prices, and a little less waste.';

  return (
    <div className="app-shell">
      <div className="announcement"><Recycle size={14} /> Give good things another story <span>·</span> Buy pre-loved, live a little lighter</div>
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => switchView('browse')} aria-label="ReLoop home"><span className="brand-mark"><Recycle size={23} /></span><span>reloop<span className="brand-period">.</span><small>COMMUNITY MARKET</small></span></button>
          <nav className={`main-nav ${mobileNavOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
            <button className={activeView === 'browse' ? 'nav-active' : ''} onClick={() => switchView('browse')}><LayoutGrid size={16} /> Browse</button>
            <button className={activeView === 'mine' ? 'nav-active' : ''} onClick={() => switchView('mine')}><Tag size={16} /> My listings</button>
            <button className={activeView === 'saved' ? 'nav-active' : ''} onClick={() => switchView('saved')}><Bookmark size={16} /> Saved</button>
          </nav>
          <div className="header-actions">
            <button className="profile-chip" type="button" onClick={changeUser} title="Change demo seller name"><span className="profile-avatar">{currentUser.slice(0, 1).toUpperCase()}</span><span>Hi, {currentUser}</span><ChevronDown size={14} /></button>
            <button className="button button-primary sell-button" onClick={openNewListing}><Plus size={17} /> Sell an item</button>
            <IconButton className="mobile-menu" label="Open navigation" onClick={() => setMobileNavOpen((value) => !value)}>{mobileNavOpen ? <X size={21} /> : <Menu size={21} />}</IconButton>
          </div>
        </div>
      </header>

      <main>
        {apiMode !== 'live' && apiMode !== 'checking' && <div className="mode-note"><CircleHelp size={15} /><span>{apiMessage}</span></div>}
        {apiMode === 'live' && <div className="mode-note live-note"><CheckCircle2 size={15} /><span>{apiMessage}</span></div>}

        <section className="hero-section">
          <div className="hero-copy"><span className="eyebrow"><Sparkles size={14} /> THE SMARTER WAY TO SHOP SECOND-HAND</span><h1>Good finds.<br /><em>Better stories.</em></h1><p>Discover pre-loved treasures from people nearby. Give things a second life — and find something you’ll love for less.</p><div className="hero-points"><span><Check size={15} /> Unique finds</span><span><Check size={15} /> Better prices</span><span><Check size={15} /> Less waste</span></div></div>
          <div className="hero-art" aria-hidden="true"><div className="hero-blob"></div><div className="hero-circle circle-one"></div><div className="hero-circle circle-two"></div><div className="hero-card hero-card-back"><span className="mini-tag">PRE-LOVED</span><div className="hero-product-shape"><ShoppingBag size={58} strokeWidth={1.3} /></div></div><div className="hero-card hero-card-front"><span className="hero-sparkle">✳</span><strong>Good things<br />keep going.</strong><small>RELOOP · REUSE · RELOVE</small></div><div className="hero-sticker"><Recycle size={18} /><span>Shop circular</span></div></div>
        </section>

        <section className="search-panel" aria-label="Search listings">
          <div className="search-input-wrap"><Search size={19} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search phones, books, headphones…" aria-label="Search products" /><kbd>⌕</kbd></div>
          <div className="search-divider"></div>
          <label className="price-filter"><span>Budget up to</span><div><span>₹</span><input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="Any price" aria-label="Maximum price" /></div></label>
          <button className="button button-primary search-button" onClick={() => { setActiveView('browse'); setFiltersOpen(false); }}><Search size={16} /> Find items</button>
        </section>

        <section className="market-section">
          <div className="market-heading"><div><span className="section-kicker">THE MARKETPLACE</span><h2>{pageTitle}</h2><p>{pageSubtitle}</p></div><div className="market-tools"><span className="results-count">{visibleListings.length} {visibleListings.length === 1 ? 'item' : 'items'}</span><div className="sort-wrap"><button className="sort-button" onClick={() => setSortMenuOpen((value) => !value)}><ArrowDownUp size={15} /> {sort === 'recommended' ? 'Recommended' : sort === 'newest' ? 'Newest first' : sort === 'price-low' ? 'Price: low to high' : 'Price: high to low'} <ChevronDown size={14} /></button>{sortMenuOpen && <div className="sort-menu">{[['recommended', 'Recommended'], ['newest', 'Newest first'], ['price-low', 'Price: low to high'], ['price-high', 'Price: high to low']].map(([value, label]) => <button key={value} onClick={() => { setSort(value); setSortMenuOpen(false); }}>{label}{sort === value && <Check size={14} />}</button>)}</div>}</div><button className={`filter-toggle ${filtersOpen ? 'filter-on' : ''}`} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={15} /> Filters</button></div></div>

          <div className="category-row" aria-label="Product categories">{CATEGORIES.map((item) => <button key={item} className={category === item ? 'category-active' : ''} onClick={() => setCategory(item)}>{item === 'All' ? <LayoutGrid size={15} /> : item === 'Electronics' ? '⌁' : item === 'Study Essentials' ? '✎' : item === 'Home & Living' ? '⌂' : item === 'Fashion' ? '◇' : item === 'Sports' ? '↗' : '＋'}<span>{item}</span></button>)}</div>

          {filtersOpen && <div className="advanced-filters"><div><strong>Refine your search</strong><p>Combine a category with a budget to narrow your options.</p></div><label>Maximum price <div className="filter-number"><span>₹</span><input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="No limit" inputMode="numeric" /></div></label><label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button-quiet" onClick={() => { setCategory('All'); setMaxPrice(''); setSearch(''); }}>Clear filters</button></div>}

          {activeView === 'mine' && <div className="my-listing-banner"><div className="profile-avatar large-avatar">{currentUser.slice(0, 1).toUpperCase()}</div><div><strong>Seller workspace</strong><p>Signed in as {currentUser}. Listings with this seller name appear here.</p></div><button className="button button-outline" onClick={changeUser}>Change demo name</button></div>}

          {visibleListings.length ? <div className="listing-grid">{visibleListings.map((listing) => <ListingCard key={listing._id} listing={listing} isSaved={savedIds.includes(listing._id)} isOwner={listing.sellerName?.toLowerCase() === currentUser.toLowerCase()} onOpen={setDetailListing} onSave={saveToggle} onEdit={openEdit} onDelete={deleteListing} />)}</div> : <EmptyState title={activeView === 'mine' ? 'No listings yet' : activeView === 'saved' ? 'Nothing saved just yet' : 'No matches found'} description={activeView === 'mine' ? 'List your first pre-loved item and give it a new home.' : activeView === 'saved' ? 'Tap the heart on a product card to keep track of items you like.' : 'Try another search, remove a filter or browse all categories.'} action={activeView === 'mine' ? 'List an item' : activeView === 'saved' ? 'Browse marketplace' : 'Clear filters'} onAction={() => activeView === 'mine' ? openNewListing() : activeView === 'saved' ? switchView('browse') : (setSearch(''), setMaxPrice(''), setCategory('All'))} />}
        </section>

        <section className="trust-strip"><div className="trust-item"><span className="trust-icon"><ShieldCheck size={20} /></span><div><strong>Buy with care</strong><p>Inspect items before you pay.</p></div></div><div className="trust-item"><span className="trust-icon"><Recycle size={20} /></span><div><strong>Give things a second life</strong><p>Keep useful things in circulation.</p></div></div><div className="trust-item"><span className="trust-icon"><MapPin size={20} /></span><div><strong>Find items nearby</strong><p>Connect with your local community.</p></div></div></section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><span className="brand-mark"><Recycle size={20} /></span><span>reloop<span className="brand-period">.</span></span></div><p>Pre-loved, reloved. A small marketplace with a lighter footprint.</p><span className="footer-course">Full Stack Web Development Laboratory · Experiment 2(b)</span></footer>

      {listingModal && <ListingForm key={listingModal.listing?._id || 'new-listing'} initial={listingModal.listing} currentUser={currentUser} onClose={() => setListingModal(null)} onSubmit={saveListing} busy={busy} />}
      {detailListing && <DetailModal listing={detailListing} currentUser={currentUser} onClose={() => setDetailListing(null)} onSave={saveToggle} isSaved={savedIds.includes(detailListing._id)} onInquiry={(listing) => { setDetailListing(null); setInquiryListing(listing); }} onEdit={openEdit} onDelete={deleteListing} />}
      {inquiryListing && <InquiryForm listing={inquiryListing} onClose={() => setInquiryListing(null)} onSubmit={submitInquiry} busy={busy} />}
      {successInquiry && <Modal title="Enquiry sent!" subtitle="Your interest has been recorded." onClose={() => setSuccessInquiry(null)}><div className="success-content"><div className="success-mark"><CheckCircle2 size={31} /></div><h3>Nice find, {successInquiry.buyerName || 'there'}!</h3><p>Your enquiry about <strong>{successInquiry.listingTitle}</strong> has been {successInquiry.mode === 'live' ? 'saved' : 'recorded in this browser demo'}.</p><div className="confirmation-details"><span>Seller</span><strong>{successInquiry.sellerName}</strong><span>Reference</span><strong>{String(successInquiry.id).slice(-9).toUpperCase()}</strong></div><p className="form-hint">This is not a payment or confirmed purchase. Contact the seller to agree on availability, item condition and a safe handover.</p><button className="button button-primary full-width" onClick={() => setSuccessInquiry(null)}>Back to marketplace</button></div></Modal>}
      {toast && <div className={`toast ${toastKind === 'error' ? 'toast-error' : ''}`} role="status"><span>{toastKind === 'error' ? <CircleHelp size={18} /> : <CheckCircle2 size={18} />}</span>{toast}<IconButton label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></IconButton></div>}
      {mobileNavOpen && <button className="mobile-nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
    </div>
  );
}

export default App;
