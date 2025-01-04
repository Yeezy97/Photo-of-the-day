"use strict";

const dashboard_menu = document.querySelectorAll(".menu-button");

// dashboard profile page
const profile_newpassword = document.querySelector(".newpassword");
const profile_confirmpassword = document.querySelector(".confirmpassword");
const profile_form = document.querySelector(".form-profile");
const submit_button_profile = document.querySelector(".submit-button-profile");
const profile_error_message = document.querySelector(".error");

let html_element = document.getElementsByTagName("html");

console.log(html_element);

dashboard_menu.forEach((item) => {
  item.addEventListener("click", function () {
    console.log(this);
    console.log(this.innerText);
  });
});

console.log(dashboard_menu);

// create-post dropdown menu function
document.addEventListener("DOMContentLoaded", function () {
  const dropdown = document.getElementById("dropdown");
  const inputField = document.getElementById("inputField");

  dropdown.addEventListener("change", function () {
    inputField.value = dropdown.value;
  });
});

submit_button_profile.addEventListener("click", async function (e) {
  e.preventDefault();

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
        window.location.href = "/dashboard"; //if okay, redirect to the dashboard.
        // const html = await response.text(); // Get the HTML as a string
        // html_element.innerHTML = html;
        // return;

        const successData = await response.json();
        console.log("Profile updated successfully", successData);
        if (successData) {
          messageElement.textContent = successData.error;
          submit_button_profile.after(messageElement);
          setTimeout(() => {
            messageElement.remove();
          }, 4000);
        }
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
      messageElement.textContent = "Password does not match!!";
      submit_button_profile.after(messageElement);
      setTimeout(() => {
        messageElement.remove();
      }, 4000);
    } else {
      // if all conditions matches then send data

      const formData = new FormData(profile_form); // Get the form data

      try {
        const response = await fetch("/dashboard/profile", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          window.location.href = "/dashboard"; //if okay, redirect to the dashboard.

          // const html = await response.text(); // Get the HTML as a string
          // html_element.innerHTML = html;
          // return;
          const successData = await response.json();
          console.log("Profile updated successfully", successData);
          // profile_error_message.textContent = successData.error;
          if (successData) {
            messageElement.textContent = successData.error;
            submit_button_profile.after(messageElement);
            setTimeout(() => {
              messageElement.remove();
            }, 4000);
          }
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
      }
    }
  }
});
