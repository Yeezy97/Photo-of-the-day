"use strict";

function getCookie(token) {
  const value = `; ${document.cookie}`; // Prefix the cookie string with semicolon for easy splitting
  const parts = value.split(`; ${token}=`); // Split the cookie string at the name part
  if (parts.length === 2) return parts.pop().split(";").shift(); // Return the value of the cookie if found
  return null; // Return null if the cookie is not found
}

let token = getCookie("token");

const nav_menu_open = document.querySelector(".mobile-menu-icon");
const nav_burger_close = document.querySelector(".mobile-menu-close");
const sidenav = document.querySelector(".sidenav");
const category_grid_item = document.querySelectorAll(".grid-item");
const favourite_button_element = document.querySelectorAll(".favourite-button");

console.log(category_grid_item);

nav_menu_open.addEventListener("click", () => {
  sidenav.classList.toggle("active");
  //   sidenav.style.display = "grid";
});

nav_burger_close.addEventListener("click", () => {
  sidenav.classList.toggle("active");
});

console.log(favourite_button_element);

favourite_button_element.forEach((item) => {
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

      console.log("Post ID:", postId);
      console.log("User Who Uploaded, ID:", userPostId);

      const svgPath = e.target
        .closest(".favourite-button")
        .querySelector("svg path");

      // Toggle the fill color
      if (svgPath) {
        const currentFill = svgPath.getAttribute("fill");
        svgPath.setAttribute("fill", currentFill === "red" ? "none" : "red"); // Toggle between red and default
      }

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
    }
  });
});

// console.log("cookie", document.cookie);
