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

// --------------- from dashboard ------------

// const dashboard_menu = document.querySelectorAll(".menu-button");

// // dashboard profile page
// const profile_newpassword = document.querySelector(".newpassword");
// const profile_confirmpassword = document.querySelector(".confirmpassword");
// const profile_form = document.querySelector(".form-profile");
// const create_form = document.querySelector(".create-form");
// const submit_button_profile = document.querySelector(".submit-button-profile");
// const submit_button_create = document.querySelector(".submit-button-create");
// const profile_error_message = document.querySelector(".error");

// // create-post dropdown menu function
// document.addEventListener("DOMContentLoaded", function () {
//   const dropdown = document.getElementById("dropdown");
//   const inputField = document.getElementById("inputField");

//   if (dropdown) {
//     dropdown.addEventListener("change", function () {
//       inputField.value = dropdown.value;
//     });
//   }
// });

// --------------- from dashboard ------------

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

      console.log("Post ID:", postId);
      console.log("User Who Uploaded, ID:", userPostId);

      // const svgPath = e.target
      //   .closest(".like-button")
      //   .querySelector("svg path");

      // Toggle the fill color
      // if (svgPath) {
      //   const currentFill = svgPath.getAttribute("fill");
      //   // #005cd4"
      //   console.log(currentFill);

      // svgPath.setAttribute("fill", currentFill === "blue" ? "none" : "blue"); // Toggle between red and default
      // }

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
    console.log(e);
    console.log(e.target);
    // if user is logged in
    console.log(window.location.pathname);

    if (token) {
      // const parent = e.target.parentElement;
      const parentElement = e.target.closest(".card");

      console.log("Parent Element:", parentElement);

      console.log(parentElement.dataset);

      const postId = parentElement.dataset.postId;
      const userPostId = parentElement.dataset.userId;

      console.log("Post ID:", postId);
      console.log("User Who Uploaded, ID:", userPostId);

      // const svgPath = e.target
      //   .closest(".favourite-button")
      //   .querySelector("svg path");

      // // Toggle the fill color
      // if (svgPath) {
      //   const currentFill = svgPath.getAttribute("fill");
      //   svgPath.setAttribute("fill", currentFill === "red" ? "none" : "red"); // Toggle between red and default
      // }

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
          let response = await fetch("/dashboard/remove-favourite", {
            method: "POST", // Method is POST
            headers: {
              "Content-Type": "application/json", // Inform the server that the body is JSON
            },
            body: JSON.stringify({
              postId: postId,
            }), // Sending the userId and postId as JSON data
          });

          if (response.ok) {
            // const result = await response.json(); // Handle the response from the server
            // if (result.status) {
            //   let response = await fetch("/dashboard/favourite-post", {
            //     method: "GET", // Method is POST
            //     headers: {
            //       "Content-Type": "application/json", // Inform the server that the body is JSON
            //     },
            //   });
            // }
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

/*
if (submit_button_create) {
  submit_button_create.addEventListener("click", async function (e) {
    e.preventDefault();

    spinner.classList.remove("hidden");

    // const submitButtonCreate = document.querySelector('submit-button-create');
    submit_button_create.textContent = "Loading...";
    submit_button_create.disabled = true;

    console.log("waiting");
    let messageElement = document.createElement("p");
    messageElement.classList.add("message-element");

    const formData = new FormData(create_form); // Get the form data

    try {
      const response = await fetch("/dashboard/create-post", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        messageElement.textContent = "Post Created";
        submit_button_create.after(messageElement);
        create_form.reset();
        setTimeout(() => {
          messageElement.remove();
          // window.location.reload();
        }, 3000);
        // const successData = await response.json();
        // if (successData) {
        //   console.log(successData.status, "success data block");
        // }
        // if (successData) {
        //   messageElement.textContent = successData.error;
        //   submit_button_create.after(messageElement);
        //   setTimeout(() => {
        //     messageElement.remove();
        //   }, 4000);
        // }
        // const html = await response.text(); // Get the HTML as a string
        // html_element.innerHTML = html;
        // return;

        // const successData = await response.json();
        // console.log("Profile updated successfully", successData);
        // if (successData) {
        //   messageElement.textContent = successData.error;
        //   submit_button_profile.after(messageElement);
        //   setTimeout(() => {
        //     messageElement.remove();
        //   }, 4000);
        // }
        // messageSection("success", "Your post is created.");
        // console.log("Profile updated successfully", successData);
        // profile_error_message.textContent = successData.error;
      } else {
        const errorData = await response.json();

        console.log("failed");

        console.error("Error updating profile", errorData);
        messageSection("error", "Something went wrong try again.");
      }
    } catch (error) {
      console.log("failed from catch");

      console.error("Error during fetch operation", error);
      messageSection("error", "Something went wrong try again.");
    } finally {
      submit_button_create.textContent = "Create Post";
      submit_button_create.disabled = false;
      console.log("finally success");
      spinner.classList.add("hidden");
    }
  });
}
*/

/*
if (submit_button_profile) {
  submit_button_profile.addEventListener("click", async function (e) {
    e.preventDefault();

    submit_button_profile.textContent = "Loading...";
    submit_button_profile.disabled = true;

    spinner.classList.remove("hidden");
    console.log("from sc");

    let messageElement = document.createElement("p");
    messageElement.classList.add("message-element");
    if (
      profile_newpassword.value === "" &&
      profile_confirmpassword.value === ""
    ) {
      // if no password
      const formData = new FormData(profile_form); // Get the form data

      try {
        const response = await fetch("/dashboard/profile", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          console.log("from res ok 1");

          // const html = await response.text(); // Get the HTML as a string
          // html_element.innerHTML = html;
          // return;
          messageElement.textContent = "Profile Updated";
          if (submit_button_profile) {
            submit_button_profile.after(messageElement);
          }
          setTimeout(() => {
            messageElement.remove();
            window.location.reload();

            // window.location.href = "/dashboard"; //if okay, redirect to the dashboard.
          }, 3000);
          // const successData = await response.json();
          // console.log("Profile updated successfully", successData);
          // if (successData) {

          // }

          // window.reload();
        } else {
          const errorData = await response.json();
          console.error("Error updating profile", errorData);
          // const messageElement = document.createElement('p');
          // messageElement.textContent = errorData.error;
          // messageElement.style.position = 'absolute';
          // messageElement.classList.add('message-element');
          // form.after(messageElement)

          //   setTimeout(() => {
          //       messageElement.classList.add("active"); //trigger the transition
          //         setTimeout(() => {
          //             messageElement.remove(); // remove after transition
          //     }, 500)
          // }, 0)
        }
      } catch (error) {
        console.error("Error during fetch operation", error);
      }
    } else if (
      profile_newpassword.value !== "" ||
      profile_confirmpassword.value !== ""
    ) {
      // if password doesnt match

      if (profile_newpassword.value !== profile_confirmpassword.value) {
        spinner.classList.add("hidden");
        messageElement.textContent = "Password does not match!!";
        submit_button_profile.after(messageElement);
        setTimeout(() => {
          messageElement.remove();
        }, 3000);
      } else {
        // if all conditions matches then send data

        const formData = new FormData(profile_form); // Get the form data

        try {
          const response = await fetch("/dashboard/profile", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            // const html = await response.text(); // Get the HTML as a string
            // html_element.innerHTML = html;
            // return;

            messageElement.textContent = "Profile Updated";
            submit_button_profile.after(messageElement);
            setTimeout(() => {
              messageElement.remove();
              window.location.reload();

              // window.location.href = "/dashboard"; //if okay, redirect to the dashboard.
            }, 3000);
            // const successData = await response.json();
            // console.log("Profile updated successfully", successData);
            // profile_error_message.textContent = successData.error;

            // if (successData) {
            // }
            console.log("from res ok 2");

            // const errorMessageContainer = document.querySelector(".dashboard-modal-content")
            // errorMessageContainer.textContent = successData.message
          } else {
            const errorData = await response.json();
            console.error("Error updating profile", errorData);
            // const messageElement = document.createElement('p');
            // messageElement.textContent = errorData.error;
            // messageElement.style.position = 'absolute';
            // messageElement.classList.add('message-element');
            // form.after(messageElement)

            //   setTimeout(() => {
            //       messageElement.classList.add("active"); //trigger the transition
            //         setTimeout(() => {
            //             messageElement.remove(); // remove after transition
            //     }, 500)
            // }, 0)
          }
        } catch (error) {
          console.error("Error during fetch operation", error);
        } finally {
          spinner.classList.add("hidden");

          submit_button_profile.textContent = "Update Profile";
          submit_button_profile.disabled = false;
        }
      }
    }
  });
}
*/
