function serializeUser(user) {
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
    followersCount: Array.isArray(user.followers) ? user.followers.length : 0,
    followingCount: Array.isArray(user.following) ? user.following.length : 0,
    postsCount: Number(user.postsCount || 0),
    followingIds: Array.isArray(user.following)
      ? user.following.map((id) => id.toString())
      : []
  };
}

module.exports = serializeUser;
