const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  // CORS enable
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  try {
    const { username, api_key } = req.query;

    if (api_key !== 'madara') {
      return res.status(401).json({
        success: false,
        error: 'Invalid API Key! Use: ?api_key=madara'
      });
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username required! Use: ?username=nike'
      });
    }

    // Instagram API call
    const igResponse = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'x-ig-app-id': '936619743392459',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    const data = await igResponse.json();
    const user = data.data?.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found!'
      });
    }

    const mediaEdges = user.edge_owner_to_timeline_media?.edges || [];
    const recentPosts = mediaEdges.slice(0, 5).map(edge => ({
      id: edge.node.id,
      link: `https://www.instagram.com/p/${edge.node.shortcode}/`,
      thumbnail: edge.node.thumbnail_src || edge.node.display_url,
      likes: edge.node.edge_liked_by?.count || 0,
      comments: edge.node.edge_media_to_comment?.count || 0,
      timestamp: new Date(edge.node.taken_at_timestamp * 1000).toISOString()
    }));

    const response = {
      success: true,
      type: 'profile',
      username: user.username || null,
      full_name: user.full_name || null,
      biography: user.biography || null,
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      posts_count: user.edge_owner_to_timeline_media?.count || 0,
      profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || null,
      external_url: user.external_url || null,
      is_verified: user.is_verified || false,
      is_private: user.is_private || false,
      business_category: user.business_category_name || null,
      has_channel: user.has_channel || false,
      mutual_followers: user.edge_mutual_followed_by?.count || 0,
      igtv_videos_count: user.edge_felix_video_timeline?.count || 0,
      recent_posts: user.is_private ? [] : recentPosts
    };

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
