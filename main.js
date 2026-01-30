LoadData();
async function LoadData() {
  //async await 
  //HTTP Request GET, GET1, PUT, POST, DELETE
  try {
    let res = await fetch('http://localhost:3000/posts');
    let posts = await res.json();
    let body = document.getElementById('post-body')
    body.innerHTML = "";
    for (const post of posts) {
      body.innerHTML += convertDataToHTML(post);
    }
  } catch (error) {
    console.log(error);
  }

}

function convertDataToHTML(post) {
  // Apply strikethrough style if post is soft deleted
  const rowStyle = post.isDeleted ? 'style="text-decoration: line-through; opacity: 0.6;"' : '';
  const deleteButtonText = post.isDeleted ? 'Restore' : 'Delete';

  return `<tr ${rowStyle}>
        <td>${post.id}</td>
        <td>${post.title}</td>
        <td>${post.views}</td>
        <td>
            <input type='button' value='${deleteButtonText}' onclick='ToggleDelete("${post.id}", ${post.isDeleted})'/>
            <input type='button' value='Edit' onclick='EditPost("${post.id}")'/>
            <input type='button' value='Comments' onclick='LoadComments("${post.id}")'/>
        </td>
    </tr>`;
}

// Get next available ID (auto-increment)
async function getNextId() {
  try {
    let res = await fetch('http://localhost:3000/posts');
    let posts = await res.json();

    if (posts.length === 0) return "1";

    // Find max ID and add 1
    let maxId = Math.max(...posts.map(p => parseInt(p.id)));
    return String(maxId + 1);
  } catch (error) {
    console.log(error);
    return "1";
  }
}

async function saveData() {
  let id = document.getElementById("id_txt").value;
  let title = document.getElementById("title_txt").value;
  let view = document.getElementById('views_txt').value;

  // If ID is empty, auto-generate it
  if (!id || id.trim() === "") {
    id = await getNextId();
  }

  let resGET = await fetch('http://localhost:3000/posts/' + id)
  if (resGET.ok) {
    // Update existing post
    let existingPost = await resGET.json();
    let resPUT = await fetch('http://localhost:3000/posts/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: id,
        title: title,
        views: view,
        isDeleted: existingPost.isDeleted || false
      })
    });
    if (resPUT.ok) {
      console.log("Cập nhật thành công");
      alert("Cập nhật post thành công!");
      clearForm();
      LoadData();
    }
  } else {
    // Create new post
    let resPOST = await fetch('http://localhost:3000/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: id,
        title: title,
        views: view,
        isDeleted: false
      })
    })
    if (resPOST.ok) {
      console.log("Tạo mới thành công");
      alert("Tạo post mới thành công!");
      clearForm();
      LoadData();
    }
  }
}

// Soft delete implementation - toggle between delete and restore
async function ToggleDelete(id, currentDeletedStatus) {
  try {
    // Get current post data
    let resGET = await fetch('http://localhost:3000/posts/' + id);
    if (!resGET.ok) {
      alert("Không tìm thấy post!");
      return;
    }

    let post = await resGET.json();

    // Toggle isDeleted status
    let resPUT = await fetch('http://localhost:3000/posts/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...post,
        isDeleted: !currentDeletedStatus
      })
    });

    if (resPUT.ok) {
      const action = currentDeletedStatus ? "Khôi phục" : "Xóa";
      console.log(`${action} post thành công`);
      alert(`${action} post thành công!`);
      LoadData();
    }
  } catch (error) {
    console.log(error);
    alert("Có lỗi xảy ra!");
  }
}

// Edit post - populate form with post data
async function EditPost(id) {
  try {
    let res = await fetch('http://localhost:3000/posts/' + id);
    if (res.ok) {
      let post = await res.json();
      document.getElementById("id_txt").value = post.id;
      document.getElementById("title_txt").value = post.title;
      document.getElementById("views_txt").value = post.views;
    }
  } catch (error) {
    console.log(error);
  }
}

// Clear form
function clearForm() {
  document.getElementById("id_txt").value = "";
  document.getElementById("title_txt").value = "";
  document.getElementById("views_txt").value = "";
}

// ==================== COMMENT FUNCTIONS ====================

// Load comments for a specific post
async function LoadComments(postId) {
  try {
    let res = await fetch(`http://localhost:3000/comments?postId=${postId}`);
    let comments = await res.json();

    let commentSection = document.getElementById('comment-section');
    let commentList = document.getElementById('comment-list');
    let commentPostId = document.getElementById('comment-postId');

    // Show comment section
    commentSection.style.display = 'block';
    commentPostId.value = postId;

    // Display comments
    commentList.innerHTML = '<h3>Comments for Post #' + postId + '</h3>';

    if (comments.length === 0) {
      commentList.innerHTML += '<p>No comments yet.</p>';
    } else {
      for (const comment of comments) {
        commentList.innerHTML += convertCommentToHTML(comment);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

function convertCommentToHTML(comment) {
  const rowStyle = comment.isDeleted ? 'style="text-decoration: line-through; opacity: 0.6;"' : '';
  const deleteButtonText = comment.isDeleted ? 'Restore' : 'Delete';

  return `<div class="comment-item" ${rowStyle}>
        <p><strong>Comment #${comment.id}:</strong> ${comment.text}</p>
        <button onclick='EditComment("${comment.id}")'>Edit</button>
        <button onclick='ToggleDeleteComment("${comment.id}", ${comment.isDeleted})'>${deleteButtonText}</button>
    </div>`;
}

// Get next comment ID
async function getNextCommentId() {
  try {
    let res = await fetch('http://localhost:3000/comments');
    let comments = await res.json();

    if (comments.length === 0) return "1";

    let maxId = Math.max(...comments.map(c => parseInt(c.id)));
    return String(maxId + 1);
  } catch (error) {
    console.log(error);
    return "1";
  }
}

// Save comment (create or update)
async function saveComment() {
  let commentId = document.getElementById("comment-id").value;
  let commentText = document.getElementById("comment-text").value;
  let postId = document.getElementById("comment-postId").value;

  if (!commentText || commentText.trim() === "") {
    alert("Please enter comment text!");
    return;
  }

  // If ID is empty, create new comment
  if (!commentId || commentId.trim() === "") {
    commentId = await getNextCommentId();

    let resPOST = await fetch('http://localhost:3000/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: commentId,
        text: commentText,
        postId: postId,
        isDeleted: false
      })
    });

    if (resPOST.ok) {
      alert("Comment created successfully!");
      clearCommentForm();
      LoadComments(postId);
    }
  } else {
    // Update existing comment
    let resGET = await fetch('http://localhost:3000/comments/' + commentId);
    if (resGET.ok) {
      let existingComment = await resGET.json();

      let resPUT = await fetch('http://localhost:3000/comments/' + commentId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: commentId,
          text: commentText,
          postId: postId,
          isDeleted: existingComment.isDeleted || false
        })
      });

      if (resPUT.ok) {
        alert("Comment updated successfully!");
        clearCommentForm();
        LoadComments(postId);
      }
    }
  }
}

// Edit comment - populate form
async function EditComment(id) {
  try {
    let res = await fetch('http://localhost:3000/comments/' + id);
    if (res.ok) {
      let comment = await res.json();
      document.getElementById("comment-id").value = comment.id;
      document.getElementById("comment-text").value = comment.text;
    }
  } catch (error) {
    console.log(error);
  }
}

// Soft delete comment
async function ToggleDeleteComment(id, currentDeletedStatus) {
  try {
    let resGET = await fetch('http://localhost:3000/comments/' + id);
    if (!resGET.ok) {
      alert("Comment not found!");
      return;
    }

    let comment = await resGET.json();

    let resPUT = await fetch('http://localhost:3000/comments/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...comment,
        isDeleted: !currentDeletedStatus
      })
    });

    if (resPUT.ok) {
      const action = currentDeletedStatus ? "Restored" : "Deleted";
      alert(`Comment ${action} successfully!`);
      LoadComments(comment.postId);
    }
  } catch (error) {
    console.log(error);
  }
}

// Clear comment form
function clearCommentForm() {
  document.getElementById("comment-id").value = "";
  document.getElementById("comment-text").value = "";
}

// Hide comment section
function hideComments() {
  document.getElementById('comment-section').style.display = 'none';
  clearCommentForm();
}