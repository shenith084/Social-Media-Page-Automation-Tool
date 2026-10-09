

async function testFacebookPost() {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_ACCESS_TOKEN;
  
  if (!pageId || !token) {
    console.error("Missing FB_PAGE_ID or FB_ACCESS_TOKEN");
    return;
  }

  try {
    const imgRes = await fetch("http://localhost:3000/api/v1/internal/render-image?headline=Test");
    const blob = await imgRes.blob();
    
    const form = new FormData();
    form.append('message', 'Test post from nodejs native fetch');
    form.append('source', blob, 'post.png');

    console.log("Sending to Facebook...");
    const fbRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

    const data = await fbRes.json();
    if (!fbRes.ok) {
        console.error("Error from Facebook:", JSON.stringify(data, null, 2));
    } else {
        console.log("Success!", data);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testFacebookPost();
