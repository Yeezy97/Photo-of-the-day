"use strict";

const nav_menu_open = document.querySelector(".mobile-menu-icon");
const nav_burger_close = document.querySelector(".mobile-menu-close");
const sidenav = document.querySelector(".sidenav");
const likeButtons = document.querySelectorAll(".like-button");

nav_menu_open.addEventListener("click", () => {
  sidenav.classList.toggle("active");
});

nav_burger_close.addEventListener("click", () => {
  sidenav.classList.toggle("active");
});

// Handle like button click
likeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const postId = button.dataset.postId;

    fetch("/like", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: 1, post_id: postId }), // Replace user_id with the actual logged-in user's ID
    })
      .then((response) => {
        if (response.ok) {
          button.classList.add("liked"); // Mark the button as liked
        } else if (response.status === 400) {
          alert("You already liked this post.");
        } else {
          alert("An error occurred.");
        }
      })
      .catch((error) => console.error("Error:", error));
  });
});
