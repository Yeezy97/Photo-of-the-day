"use strict";

// const { GetObjectAclCommand } = require("@aws-sdk/client-s3");

function getCookie(token) {
  const value = `; ${document.cookie}`; // Prefix the cookie string with semicolon for easy splitting
  const parts = value.split(`; ${token}=`); // Split the cookie string at the name part
  if (parts.length === 2) return parts.pop().split(";").shift(); // Return the value of the cookie if found
  return null; // Return null if the cookie is not found
}

function messageSection(messageType, text) {
  const messageDiv = document.createElement("div");

  // Set the div's attributes and content
  messageDiv.className = "message-section-element";
  if (messageType === "success") messageDiv.classList.add("success");
  else messageDiv.classList.add("error");
  messageDiv.textContent = text;

  // Insert the message into the main body
  const mainBody = document.getElementsByTagName("body");
  mainBody[0].insertAdjacentElement("afterbegin", messageDiv);

  console.log("not logged in");

  setTimeout(() => {
    messageDiv.classList.add("animate");
  }, 50); // Slight delay to ensure CSS transitions work

  setTimeout(() => {
    messageDiv.remove();
  }, 2000);
}

let token = getCookie("token");

const nav_menu_open = document.querySelector(".mobile-menu-icon");
const nav_burger_close = document.querySelector(".mobile-menu-close");
const sidenav = document.querySelector(".sidenav");
const category_grid_item = document.querySelectorAll(".grid-item");
const favourite_button_element = document.querySelectorAll(".favourite-button");
const like_button_element = document.querySelectorAll(".like-button");

//  Global Error Message Element
const body = document.getElementsByTagName("body");
console.log(body);

const spinner = document.querySelector(".spinner");

nav_menu_open.addEventListener("click", () => {
  sidenav.classList.toggle("active");
  //   sidenav.style.display = "grid";
});

nav_burger_close.addEventListener("click", () => {
  sidenav.classList.toggle("active");
});

// document.addEventListener("DOMContentLoaded", function () {
like_button_element.forEach((item) => {
  item.addEventListener("click", async (e) => {
    console.log(e);
    console.log(e.target);
    // if user is logged in
    if (token) {
      // const parent = e.target.parentElement;
      const parentElement = e.target.closest(".card");

      console.log("Parent Element:", parentElement);

      console.log(parentElement.dataset);

      const postId = parentElement.dataset.postId;
      const userPostId = parentElement.dataset.userId;

      const svgElement = e.target.closest(".like-button").querySelector("svg");

      // Toggle classes on the <svg> element
      if (svgElement.classList.contains("liked")) {
        svgElement.classList.remove("liked");
        svgElement.classList.add("not-liked");
        // Optionally, send a request to the server to mark as not liked
      } else {
        svgElement.classList.remove("not-liked");
        svgElement.classList.add("liked");
        // Optionally, send a request to the server to mark as liked
      }

      try {
        let response = await fetch("/dashboard/like-post", {
          method: "POST", // Method is POST
          headers: {
            "Content-Type": "application/json", // Inform the server that the body is JSON
          },
          body: JSON.stringify({
            postId: postId,
          }), // Sending the userId and postId as JSON data
        });

        if (response.ok) {
          const result = await response.json(); // Handle the response from the server

          const likeButton = e.target.closest(".like-button");
          if (likeButton) {
            // Find the nearest card containing the clicked like button
            const card = likeButton.closest(".card");

            // Get the like-counter element within the same card
            const counter = card.querySelector(".like-counter");

            // Increment the like counter
            // const currentCount = parseInt(counter.innerHTML, 10);
            counter.innerHTML = result.likeCount;
          }
        } else {
          messageSection("error", "Something went wrong,try again!");

          console.error("Error:", response.status); // Handle errors if the request fails
        }
      } catch (error) {
        messageSection("error", "Something went wrong,try again!");
        console.log(error);
      }
    } else {
      // user not logged in
      messageSection("error", "You'r not Logged in.");
    }
  });
});

favourite_button_element.forEach((item) => {
  item.addEventListener("click", async (e) => {
    if (token) {
      // const parent = e.target.parentElement;
      const parentElement = e.target.closest(".card");

      console.log(parentElement.dataset);

      const postId = parentElement.dataset.postId;
      const userPostId = parentElement.dataset.userId;

      const svgElement = e.target
        .closest(".favourite-button")
        .querySelector("svg");

      // Toggle classes on the <svg> element
      if (svgElement.classList.contains("favourited")) {
        svgElement.classList.remove("favourited");
        svgElement.classList.add("not-favourited");
        // Optionally, send a request to the server to mark as not liked
      } else {
        svgElement.classList.remove("not-favourited");
        svgElement.classList.add("favourited");
        // Optionally, send a request to the server to mark as liked
      }

      // from dashboard favourite page
      if (window.location.pathname === "/dashboard/favourite-post") {
        try {
          let response = await fetch("/dashboard/favourite-post", {
            method: "DELETE", // Method is POST
            headers: {
              "Content-Type": "application/json", // Inform the server that the body is JSON
            },
            body: JSON.stringify({
              postId: postId,
            }), // Sending the userId and postId as JSON data
          });

          if (response.ok) {
            window.location.reload();
            console.log(result); // Process the server's response
          } else {
            console.error("Error:", response.status); // Handle errors if the request fails
          }
        } catch (error) {
          console.log(error);
        }
        return;
      }

      // from home page
      try {
        let response = await fetch("/dashboard/favourite-post", {
          method: "POST", // Method is POST
          headers: {
            "Content-Type": "application/json", // Inform the server that the body is JSON
          },
          body: JSON.stringify({
            postId: postId,
          }), // Sending the userId and postId as JSON data
        });

        if (response.ok) {
          const result = await response.json(); // Handle the response from the server
          console.log(result); // Process the server's response
        } else {
          console.error("Error:", response.status); // Handle errors if the request fails
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      // user not logged in

      console.log("not logged in");
      messageSection("error", "You'r not Logged in.");
    }
  });
});
