const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  // CORS enable
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  try {
    const { username, api_key } = req.query;

    // 🔑 API Key Check
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

    console.log(`🔍 Fetching: ${username}`);

    // 🔥 Instagram API Call with ALL headers
    const response = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.instagram.com/',
          'Origin': 'https://www.instagram.com',
          'x-ig-app-id': '936619743392459',
          'x-ig-www-claim': 'hmac.AR3X...', // optional but helps
          'Cookie': 'ig_did=...', // optional
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        }
      }
    );

    console.log(`📡 Response Status: ${response.status}`);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Instagram API returned ${response.status}`
      });
    }

    const data = await response.json();
    console.log(`✅ Data received:`, Object.keys(data));

    const user = data.data?.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found!'
      });
    }

    // 📸 Recent posts
    const mediaEdges = user.edge_owner_to_timeline_media?.edges || [];
    const recentPosts = mediaEdges.slice(0, 5).map(edge => ({
      id: edge.node.id,
      link: `https://www.instagram.com/p/${edge.node.shortcode}/`,
      thumbnail: edge.node.thumbnail_src || edge.node.display_url,
      likes: edge.node.edge_liked_by?.count || 0,
      comments: edge.node.edge_media_to_comment?.count || 0,
      timestamp: new Date(edge.node.taken_at_timestamp * 1000).toISOString()
    }));

    // 🎯 Final Response
    const finalResponse = {
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

    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
