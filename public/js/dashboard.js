"use strict";

const dashboard_menu = document.querySelectorAll(".menu-button");

// dashboard profile page
const profile_newpassword = document.querySelector(".newpassword");
const profile_confirmpassword = document.querySelector(".confirmpassword");
const profile_form = document.querySelector(".form-profile");
const create_form = document.querySelector(".create-form");
const submit_button_profile = document.querySelector(".submit-button-profile");
const submit_button_create = document.querySelector(".submit-button-create");
const profile_error_message = document.querySelector(".error");

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

// create-post dropdown menu function
document.addEventListener("DOMContentLoaded", function () {
  const dropdown = document.getElementById("dropdown");
  const inputField = document.getElementById("inputField");

  if (dropdown) {
    dropdown.addEventListener("change", function () {
      inputField.value = dropdown.value;
    });
  }
});

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
        spinner.classList.add("hidden");

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
    }
  });
}
