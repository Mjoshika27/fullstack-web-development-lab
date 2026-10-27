import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  Compass,
  Feather,
  Hash,
  Heart,
  Home,
  ImagePlus,
  LoaderCircle,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Sparkles,
  UserRound,
  UsersRound,
  X
} from 'lucide-react';
import { api, clearSession, saveSession } from './api.js';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || '?';
}

function timeAgo(value) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Avatar({ user, size = 'md' }) {
  const [broken, setBroken] = useState(false);
  const url = user?.avatarUrl;
  if (url && !broken) {
    return <img className={`avatar avatar-${size}`} src={url} alt={user?.name || 'User'} onError={() => setBroken(true)} />;
  }
  return <div className={`avatar avatar-${size} avatar-fallback`} aria-label={user?.name || 'User'}>{initials(user?.name || user?.username)}</div>;
}

function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-mark"><Feather size={21} strokeWidth={2.4} /></div>
      {!compact && <div className="brand-word">mini<span>blog</span><small>Your world, in little updates.</small></div>}
    </div>
  );
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, username: form.username, email: form.email, password: form.password };
      const result = await api(endpoint, { method: 'POST', body: payload });
      saveSession(result.token);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="auth-showcase-top"><Logo /><span className="pill-label"><Sparkles size={13} /> A little more connected</span></div>
        <div className="showcase-copy">
          <p className="eyebrow">SMALL THOUGHTS. REAL CONNECTIONS.</p>
          <h1>Your world,<br />in little <em>updates.</em></h1>
          <p className="showcase-description">A calmer corner of the internet to share what you’re learning, follow curious minds, and keep good conversations going.</p>
          <div className="showcase-people">
            <div className="mini-avatars"><span>A</span><span>P</span><span>R</span><span>+</span></div>
            <div><strong>A community that grows with you</strong><small>Share ideas. Cheer each other on.</small></div>
          </div>
        </div>
        <div className="showcase-post glass-post">
          <div className="showcase-post-header"><div className="avatar avatar-sm avatar-orange">A</div><div><strong>Arun</strong><small>@arun · 4m</small></div><BadgeCheck size={16} className="verified-icon" /></div>
          <p>Just finished learning JavaScript basics! 🚀 Excited to build more projects.</p>
          <div className="showcase-post-actions"><span><Heart size={15} /> 12</span><span><MessageCircle size={15} /> 3</span><span>↗ Share</span></div>
        </div>
        <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" />
        <div className="auth-footer-note">Made for ideas worth sharing <span>✦</span></div>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-brand"><Logo /></div>
        <div className="auth-card">
          <div className="auth-card-heading"><span className="auth-icon"><Feather size={21} /></span><p className="eyebrow">WELCOME TO MINIBLOG</p><h2>{mode === 'login' ? 'Good to see you again.' : 'Make yourself at home.'}</h2><p>{mode === 'login' ? 'Sign in and pick up where the conversation left off.' : 'Create your account and find your people.'}</p></div>
          <div className="auth-mode-switch"><button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button><button className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button></div>
          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && <>
              <label>Full name<input autoComplete="name" name="name" value={form.name} onChange={update} placeholder="Your name" required minLength={2} /></label>
              <label>Username<div className="input-prefix"><span>@</span><input autoComplete="username" name="username" value={form.username} onChange={update} placeholder="yourhandle" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" /></div></label>
            </>}
            <label>Email address<input autoComplete="email" name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required /></label>
            <label>Password<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} name="password" type="password" value={form.password} onChange={update} placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'} required minLength={mode === 'register' ? 8 : 1} /></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button auth-submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> Please wait…</> : <>{mode === 'login' ? 'Sign in to MiniBlog' : 'Create my account'} <ArrowRight size={17} /></>}</button>
          </form>
          <div className="auth-privacy"><span className="privacy-dot" /> Your little corner, with your account.</div>
          <p className="auth-switch-copy">{mode === 'login' ? 'New around here?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        </div>
        <p className="auth-legal">By continuing, you agree to keep MiniBlog kind and respectful.</p>
      </section>
    </main>
  );
}

function Composer({ user, onPostCreated, notify }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputId = 'composer-image-input';

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { notify('Choose an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { notify('Images must be 5 MB or smaller.', 'error'); return; }
    setUploading(true);
    setFileName(file.name);
    try {
      const body = new FormData();
      body.append('image', file);
      const result = await api('/uploads', { method: 'POST', body });
      setImageUrl(result.url);
      notify('Image attached. Add a thought to go with it.');
    } catch (error) {
      notify(error.message, 'error');
      setFileName('');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = () => { setImageUrl(''); setFileName(''); };

  const submit = async (event) => {
    event.preventDefault();
    if (!content.trim() && !imageUrl) return;
    setPosting(true);
    try {
      const result = await api('/posts', { method: 'POST', body: { content: content.trim(), imageUrl } });
      onPostCreated(result.post);
      setContent('');
      removeImage();
      notify('Your post is live ✨');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <form className="composer card" onSubmit={submit}>
      <Avatar user={user} size="lg" />
      <div className="composer-main">
        <textarea id="composer-textarea" aria-label="Write a post" value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} placeholder="What's happening? Share a thought…" rows={3} />
        {imageUrl && <div className="composer-image-preview"><img src={imageUrl} alt="Attached to your post" /><button type="button" onClick={removeImage} aria-label="Remove attached image"><X size={16} /></button><span>{fileName || 'Image attached'}</span></div>}
        <div className="composer-toolbar">
          <div className="composer-tools">
            <input id={fileInputId} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={uploadImage} />
            <label className="tool-button" htmlFor={fileInputId} title="Attach an image"><ImagePlus size={18} /><span>{uploading ? 'Uploading…' : 'Photo'}</span></label>
            <span className={`character-count ${content.length > 900 ? 'near-limit' : ''}`}>{content.length}<span>/1000</span></span>
          </div>
          <button className="primary-button publish-button" type="submit" disabled={posting || uploading || (!content.trim() && !imageUrl)}>{posting ? <LoaderCircle className="spin" size={16} /> : <Feather size={16} />} <span>{posting ? 'Posting' : 'Publish post'}</span></button>
        </div>
      </div>
    </form>
  );
}

function PostCard({ post, currentUser, onLike, onComment, onDelete, onFollow, onUnfollow, notify }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwn = post.author?.id === currentUser.id;
  const isFollowing = currentUser.followingIds?.includes(post.author?.id);

  const submitComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      await onComment(post.id, commentText.trim());
      setCommentText('');
      setCommentsOpen(true);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <article className="post-card card">
      <Avatar user={post.author} size="lg" />
      <div className="post-main">
        <div className="post-header">
          <div className="post-author-line"><strong>{post.author?.name || 'MiniBlog user'}</strong><span className="post-handle">@{post.author?.username || 'user'}</span><span className="post-dot">·</span><time title={new Date(post.createdAt).toLocaleString()}>{timeAgo(post.createdAt)}</time></div>
          <div className="post-menu-wrap">
            {!isOwn && <button className={`mini-follow ${isFollowing ? 'is-following' : ''}`} onClick={() => isFollowing ? onUnfollow(post.author) : onFollow(post.author)} aria-label={isFollowing ? `Unfollow ${post.author?.name}` : `Follow ${post.author?.name}`}>{isFollowing ? 'Following' : 'Follow'}</button>}
            {isOwn && <><button className="icon-button quiet" onClick={() => setMenuOpen((value) => !value)} aria-label="Post options"><MoreHorizontal size={20} /></button>{menuOpen && <div className="post-menu"><button onClick={() => { setMenuOpen(false); onDelete(post.id); }}>Delete post</button></div>}</>}
          </div>
        </div>
        {post.content && <p className="post-content">{post.content}</p>}
        {post.imageUrl && <div className="post-image-wrap"><img src={post.imageUrl} alt="Post attachment" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /></div>}
        <div className="post-actions">
          <button className={`post-action comment-action ${commentsOpen ? 'active' : ''}`} onClick={() => setCommentsOpen((value) => !value)} aria-label="Show comments"><span className="action-icon"><MessageCircle size={18} /></span><span>{post.commentsCount || 0}</span></button>
          <button className={`post-action like-action ${post.likedByMe ? 'liked' : ''}`} onClick={() => onLike(post.id)} aria-label={post.likedByMe ? 'Unlike post' : 'Like post'}><span className="action-icon"><Heart size={18} fill={post.likedByMe ? 'currentColor' : 'none'} /></span><span>{post.likesCount || 0}</span></button>
          <span className="post-action-spacer" />
          <span className="post-reaction-note">{post.likesCount ? 'People liked this' : 'Be the first to react'}</span>
        </div>
        {commentsOpen && <div className="comments-area">
          {post.comments?.length > 0 ? <div className="comments-list">{post.comments.map((comment) => <div className="comment-row" key={comment.id}><Avatar user={comment.author} size="sm" /><div className="comment-bubble"><div className="comment-meta"><strong>{comment.author?.name || 'User'}</strong><span>@{comment.author?.username || 'user'}</span><time>{timeAgo(comment.createdAt)}</time></div><p>{comment.text}</p></div></div>)}</div> : <p className="no-comments">No comments yet. Start the conversation.</p>}
          <form className="comment-form" onSubmit={submitComment}><Avatar user={currentUser} size="sm" /><input aria-label="Write a comment" value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={500} placeholder="Write a thoughtful reply…" /><button type="submit" disabled={sendingComment || !commentText.trim()} aria-label="Send comment">{sendingComment ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}</button></form>
        </div>}
      </div>
    </article>
  );
}

function PersonCard({ person, onFollow }) {
  const [busy, setBusy] = useState(false);
  const handleFollow = async () => {
    setBusy(true);
    try { await onFollow(person); } finally { setBusy(false); }
  };
  return <div className="person-row"><Avatar user={person} size="md" /><div className="person-details"><strong>{person.name}</strong><span>@{person.username}</span>{person.bio && <small>{person.bio}</small>}</div><button className="follow-button" onClick={handleFollow} disabled={busy}>{busy ? <LoaderCircle className="spin" size={14} /> : 'Follow'}</button></div>;
}

function RightRail({ suggestions, currentUser, onFollow, onExplore, loadingSuggestions }) {
  const [quickSearch, setQuickSearch] = useState('');
  return (
    <aside className="right-rail">
      <form className="search-box" onSubmit={(event) => { event.preventDefault(); onExplore(quickSearch); }}><Search size={18} /><input aria-label="Search MiniBlog" placeholder="Search conversations" value={quickSearch} onChange={(event) => setQuickSearch(event.target.value)} /><kbd>↵</kbd></form>
      <section className="rail-card card">
        <div className="rail-card-heading"><h3>People to follow</h3><button onClick={onExplore} aria-label="Explore people"><ArrowRight size={16} /></button></div>
        {loadingSuggestions ? <div className="rail-loading"><LoaderCircle className="spin" size={17} /> Finding people…</div> : suggestions.length ? <div className="people-list">{suggestions.slice(0, 5).map((person) => <PersonCard key={person.id} person={person} onFollow={onFollow} />)}</div> : <div className="rail-empty"><span className="rail-empty-icon"><UsersRound size={20} /></span><strong>You're all caught up</strong><p>More people will show up here as the community grows.</p></div>}
      </section>
      <section className="rail-card trend-card card"><div className="rail-card-heading"><h3>A little inspiration</h3><Sparkles size={17} /></div><p className="inspiration-quote">“Great things are done by a series of small things brought together.”</p><span className="quote-credit">— Vincent van Gogh</span><div className="rail-divider" /><div className="topic-row"><span className="topic-hash"><Hash size={15} /></span><div><strong>#BuildInPublic</strong><small>Share your progress</small></div></div><div className="topic-row"><span className="topic-hash"><Hash size={15} /></span><div><strong>#TodayILearned</strong><small>One new thing at a time</small></div></div></section>
      <div className="right-rail-footer"><span>About</span><span>Community guidelines</span><span>Privacy</span><small>© 2026 MiniBlog</small></div>
    </aside>
  );
}

function AppShell({ user, onLogout }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [activePage, setActivePage] = useState('home');
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [notice, setNotice] = useState(null);
  const [feedVersion, setFeedVersion] = useState(0);
  const [suggestionsVersion, setSuggestionsVersion] = useState(0);
  const [logoutMenuOpen, setLogoutMenuOpen] = useState(false);

  const notify = useCallback((message, type = 'success') => {
    setNotice({ message, type });
    window.clearTimeout(window.__miniblogToastTimer);
    window.__miniblogToastTimer = window.setTimeout(() => setNotice(null), 3400);
  }, []);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      setLoadingFeed(true);
      try {
        const mode = activePage === 'following' ? 'following' : activePage === 'profile' ? 'profile' : activePage === 'explore' ? 'explore' : 'for-you';
        const query = activePage === 'explore' && searchQuery.trim() ? `&q=${encodeURIComponent(searchQuery.trim())}` : '';
        const result = await api(`/posts/feed?mode=${mode}${query}`);
        if (alive) setPosts(result.posts || []);
      } catch (error) {
        if (alive) notify(error.message, 'error');
      } finally {
        if (alive) setLoadingFeed(false);
      }
    }, activePage === 'explore' && searchQuery ? 220 : 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [activePage, currentUser.id, feedVersion, searchQuery, notify]);

  useEffect(() => {
    let alive = true;
    setLoadingSuggestions(true);
    api('/users/suggestions')
      .then((result) => { if (alive) setSuggestions(result.users || []); })
      .catch((error) => { if (alive) notify(error.message, 'error'); })
      .finally(() => { if (alive) setLoadingSuggestions(false); });
    return () => { alive = false; };
  }, [currentUser.id, currentUser.followingCount, suggestionsVersion, notify]);

  const pageTitle = useMemo(() => ({ home: 'Home', following: 'Following', explore: 'Explore', profile: 'Your profile' }[activePage]), [activePage]);
  const pageSubtitle = useMemo(() => ({ home: 'A little bit of everyone you follow.', following: 'Only from the people you follow.', explore: 'Find a thought, a person, or a new point of view.', profile: 'Your thoughts, all in one place.' }[activePage]), [activePage]);

  const onPostCreated = (post) => {
    setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
    setCurrentUser((current) => ({ ...current, postsCount: (current.postsCount || 0) + 1 }));
    setFeedVersion((value) => value + 1);
  };

  const onLike = async (postId) => {
    try {
      const result = await api(`/posts/${postId}/like`, { method: 'POST' });
      setPosts((current) => current.map((post) => post.id === postId ? result.post : post));
    } catch (error) { notify(error.message, 'error'); }
  };

  const onComment = async (postId, text) => {
    const result = await api(`/posts/${postId}/comments`, { method: 'POST', body: { text } });
    setPosts((current) => current.map((post) => post.id === postId ? result.post : post));
  };

  const onFollow = async (person) => {
    try {
      const result = await api(`/users/${person.id}/follow`, { method: 'POST', body: {} });
      setCurrentUser(result.user);
      setSuggestionsVersion((value) => value + 1);
      setFeedVersion((value) => value + 1);
      notify(result.message || `Following @${person.username}.`);
    } catch (error) { notify(error.message, 'error'); }
  };

  const onUnfollow = async (person) => {
    try {
      const result = await api(`/users/${person.id}/follow`, { method: 'DELETE' });
      setCurrentUser(result.user);
      setSuggestionsVersion((value) => value + 1);
      setFeedVersion((value) => value + 1);
      notify(result.message || `Unfollowed @${person.username}.`);
    } catch (error) { notify(error.message, 'error'); }
  };

  const goExplore = (query) => {
    setActivePage('explore');
    if (typeof query === 'string') setSearchQuery(query);
  };

  const onDelete = async (postId) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api(`/posts/${postId}`, { method: 'DELETE' });
      setPosts((current) => current.filter((post) => post.id !== postId));
      setCurrentUser((current) => ({ ...current, postsCount: Math.max(0, (current.postsCount || 0) - 1) }));
      notify('Post deleted.');
    } catch (error) { notify(error.message, 'error'); }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'following', label: 'Following', icon: UsersRound },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'profile', label: 'My profile', icon: UserRound }
  ];

  return (
    <div className="app-page">
      <header className="topbar"><div className="topbar-inner"><button className="topbar-brand-button" onClick={() => { setActivePage('home'); setSearchQuery(''); }} aria-label="Go home"><Logo /></button><div className="topbar-center"><span className="topbar-message"><span className="live-dot" /> Your people. Your ideas. Your little corner.</span></div><div className="topbar-account"><button className="topbar-avatar-button" onClick={() => setLogoutMenuOpen((value) => !value)}><Avatar user={currentUser} size="sm" /><span className="topbar-account-name">{currentUser.name}</span><ChevronDown size={15} /></button>{logoutMenuOpen && <div className="account-menu"><div className="account-menu-user"><Avatar user={currentUser} size="md" /><div><strong>{currentUser.name}</strong><span>@{currentUser.username}</span></div></div><button onClick={() => { setLogoutMenuOpen(false); setActivePage('profile'); }}><UserRound size={16} /> View profile</button><button className="logout-option" onClick={onLogout}><LogOut size={16} /> Sign out</button></div>}</div></div></header>
      <main className="app-layout">
        <aside className="left-rail">
          <div className="desktop-brand"><Logo /></div>
          <nav className="main-nav" aria-label="Main navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activePage === id ? 'active' : ''}`} onClick={() => { setActivePage(id); setLogoutMenuOpen(false); }}><span className="nav-icon"><Icon size={20} strokeWidth={activePage === id ? 2.5 : 2} /></span><span>{label}</span>{id === 'following' && currentUser.followingCount > 0 && <span className="nav-count">{currentUser.followingCount}</span>}</button>)}</nav>
          <button className="sidebar-compose" onClick={() => { setActivePage('home'); window.setTimeout(() => document.getElementById('composer-textarea')?.focus(), 60); }}><Feather size={18} /><span>Write a post</span></button>
          <div className="sidebar-spacer" />
          <div className="sidebar-mini-profile"><Avatar user={currentUser} size="md" /><div className="sidebar-user-copy"><strong>{currentUser.name}</strong><span>@{currentUser.username}</span></div><button className="icon-button quiet sidebar-logout" onClick={onLogout} aria-label="Sign out"><LogOut size={17} /></button></div>
          <div className="sidebar-note"><span className="note-star">✦</span><p>Good ideas grow when they're shared.</p></div>
        </aside>

        <section className="feed-column">
          <div className="feed-heading"><div><p className="eyebrow">YOUR MINI WORLD</p><h1>{pageTitle}</h1><p className="feed-subtitle">{pageSubtitle}</p></div><div className="feed-heading-icon"><Sparkles size={20} /></div></div>
          {activePage === 'home' && <div className="feed-tabs"><button className="active" onClick={() => setActivePage('home')}>For you <span /></button><button onClick={() => setActivePage('following')}>Following</button></div>}
          {activePage === 'explore' && <div className="explore-search"><Search size={18} /><input autoFocus placeholder="Search posts or people…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /><button aria-label="Clear search" onClick={() => setSearchQuery('')}><X size={16} /></button></div>}
          {(activePage === 'home' || activePage === 'profile') && <Composer user={currentUser} onPostCreated={onPostCreated} notify={notify} />}
          {activePage === 'following' && <div className="following-info"><UsersRound size={17} /><span>Posts from people you follow, plus your own updates.</span></div>}
          {activePage === 'profile' && <div className="profile-summary card"><div className="profile-cover" /><div className="profile-summary-body"><Avatar user={currentUser} size="xl" /><div className="profile-summary-name"><h2>{currentUser.name}</h2><span>@{currentUser.username}</span></div><p>{currentUser.bio || 'Finding my voice, one post at a time.'}</p><div className="profile-stats"><div><strong>{currentUser.postsCount || 0}</strong><span>Posts</span></div><button onClick={() => setActivePage('following')}><strong>{currentUser.followingCount || 0}</strong><span>Following</span></button><div><strong>{currentUser.followersCount || 0}</strong><span>Followers</span></div></div></div></div>}

          <div className="posts-list" aria-live="polite">
            {loadingFeed ? <div className="feed-loading card"><LoaderCircle className="spin" size={21} /><span>Gathering the good stuff…</span></div> : posts.length ? posts.map((post) => <PostCard key={post.id} post={post} currentUser={currentUser} onLike={onLike} onComment={onComment} onDelete={onDelete} onFollow={onFollow} onUnfollow={onUnfollow} notify={notify} />) : <div className="empty-feed card"><div className="empty-icon"><Feather size={24} /></div><h3>{activePage === 'following' ? 'Your feed is waiting for people.' : activePage === 'profile' ? 'Your first post starts here.' : activePage === 'explore' && searchQuery ? 'No matches just yet.' : 'A fresh page, full of possibility.'}</h3><p>{activePage === 'following' ? 'Follow a few people from the right panel and their posts will find their way here.' : activePage === 'profile' ? 'Share a thought, a lesson, or something you are proud of.' : activePage === 'explore' && searchQuery ? 'Try another search or explore a different topic.' : 'Be the first to add a thought, or explore people to find your community.'}</p>{activePage !== 'following' && <button className="text-button" onClick={() => setActivePage('explore')}>Explore MiniBlog <ArrowRight size={16} /></button>}</div>}
          </div>
          <footer className="feed-footer">A small thought can start a big conversation <span>✦</span></footer>
        </section>

        <RightRail suggestions={suggestions} currentUser={currentUser} onFollow={onFollow} onExplore={goExplore} loadingSuggestions={loadingSuggestions} />
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activePage === id ? 'active' : ''} onClick={() => setActivePage(id)} aria-label={label}><Icon size={20} /><span>{label}</span></button>)}</nav>
      {notice && <div className={`toast toast-${notice.type}`} role="status"><span className="toast-icon">{notice.type === 'error' ? <X size={16} /> : <Check size={16} />}</span>{notice.message}<button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!localStorage.getItem('miniblog_token')) {
      setCheckingSession(false);
      return () => { alive = false; };
    }
    api('/auth/me')
      .then((result) => { if (alive) setUser(result.user); })
      .catch(() => { clearSession(); })
      .finally(() => { if (alive) setCheckingSession(false); });
    return () => { alive = false; };
  }, []);

  if (checkingSession) return <div className="boot-screen"><div className="boot-mark"><Feather size={24} /></div><p>Opening your little corner…</p><LoaderCircle className="spin" size={20} /></div>;
  if (!user) return <AuthPage onAuthenticated={setUser} />;
  return <AppShell user={user} onLogout={() => { clearSession(); setUser(null); }} />;
}
