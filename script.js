// Eugene Kepich

class menu_dish {
  constructor(
    dish_id,
    dish_name,
    dish_short_name,
    dish_description,
    dish_price,
    dish_availability,
    dish_image_url
  ) {
    this.id = dish_id;
    this.name = dish_name;
    this.nickname = dish_short_name;
    this.description = dish_description;
    this.price = dish_price;
    this.availability = dish_availability;
    this.image = dish_image_url;
  }
}

class menu_category {
  constructor(
    category_id,
    category_name,
    category_description,
    category_image
  ) {
    this.id = category_id;
    this.name = category_name;
    this.description = category_description;
    this.image = category_image;
    this.dishes = []; //dishes go here
  }

  add_dish(dish) {
    this.dishes.push(dish);
  }

  get_dishes() {
    return this.dishes;
  }

  get_number_of_dishes() {
    return this.dishes.length;
  }

  get_category_id() {
    return this.id;
  }

  has_dish(dish_id) {
    return this.dishes.some((dish) => dish.id === dish_id);
  }
}

class store_menu {
  constructor() {
    this.categories = [];
    // this variable will be set to true once the store is loaded
    // so I can check if the store is loaded before trying to access it
    this.store_loaded = false;
  }

  async initialize_from_json(url) {
    try {
      const response = await window.fetch(url);
      const menu_data = await response.json();

      menu_data.menu.forEach((category_data) => {
        const category = new menu_category(
          category_data.id,
          category_data.name,
          category_data.description,
          category_data.image
        );

        category_data.dishes.forEach((dish_data) => {
          const dish = new menu_dish(
            dish_data.id,
            dish_data.name,
            dish_data.short_name,
            dish_data.description,
            dish_data.price,
            dish_data.availability,
            dish_data.image
          );
          category.add_dish(dish);
        });

        this.add_category(category);
      });

      this.store_loaded = true;
      console.log("Menu initialized successfully.");
    } catch (error) {
      alert("Error initializing menu. Please try again later.");
      console.error("Error initializing menu:", error);
    }
  }

  add_category(category) {
    this.categories.push(category);
  }

  get_category_by_dish_id(dish_id) {
    return this.categories.find((category) => category.has_dish(dish_id));
  }

  get_category_by_id(category_id) {
    return this.categories.find((category) => category.id === category_id);
  }

  get_all_dishes() {
    return this.categories.flatMap((category) => category.dishes);
  }

  get_number_of_categories() {
    return this.categories.length;
  }
}

class store_cart {
  constructor() {
    this.load_cart();
    this.initialize_cart_count();
    this.update_cart_count();
    console.log("Cart initialized successfully.");
  }

  // load cart data from local storage (or init)
  load_cart() {
    const cart_data = window.localStorage.getItem("store_cart");
    if (cart_data) {
      this.cart = JSON.parse(cart_data);
      this.cleanup_cart();
    } else {
      // Init an empty cart
      this.cart = [];
      this.save_cart();
    }
  }

  // initialize cart count
  initialize_cart_count() {
    if (window.localStorage.getItem("cart_count") === null) {
      window.localStorage.setItem("cart_count", "0");
    }
  }

  // save state
  save_cart() {
    window.localStorage.setItem("store_cart", JSON.stringify(this.cart));
  }

  add_dish(dish_id, quantity = 1) {
    const cart_count = parseInt(window.localStorage.getItem("cart_count")) || 0;

    // 99max
    if (cart_count + quantity > 99) {
      show_status_message("Cart is full", true);
      return;
    }

    // in cart?
    const existing_item = this.cart.find((item) => item.dish_id === dish_id);
    if (existing_item) {
      existing_item.quantity += quantity;
    } else {
      this.cart.push({ dish_id, quantity });
    }

    this.save_cart();
    this.update_cart_count();
    if (quantity > 0) show_status_message("Added");
    else show_status_message("Removed");
  }

  remove_dish(dish_id) {
    this.cart = this.cart.filter((item) => item.dish_id !== dish_id);
    this.save_cart();
    this.update_cart_count();
  }

  clear_cart() {
    this.cart = [];
    this.save_cart();
    this.update_cart_count();
  }

  get_all_items() {
    return this.cart;
  }

  cleanup_cart() {
    // list of available dish ids
    const available_dish_ids = object_store_menu
      .get_all_dishes()
      .map((dish) => dish.id);

    // create a new cart with only items that are still in the menu
    // only keep items that are available
    const updated_cart = [];
    for (let item of this.cart) {
      if (available_dish_ids.includes(item.dish_id)) {
        updated_cart.push(item);
      }
    }

    // replace old cart
    this.cart = updated_cart;
    this.save_cart();
    this.update_cart_count();
  }

  // update the cart count in local storage
  update_cart_count() {
    let cart_count = 0;
    for (let item of this.cart) {
      cart_count += item.quantity;
    }
    window.localStorage.setItem("cart_count", cart_count);

    // update count display in the html with the correct idd
    const cart_count_element = document.getElementById("cart_count");
    if (cart_count_element) {
      cart_count_element.textContent = cart_count;
    }
  }
}

function process_category(category, category_template, category_container) {
  // clone template
  const category_element = category_template.cloneNode(true);
  category_element.style.display = "block";
  category_element.id = category.id;

  category_element.querySelector(".menu_category_heading").textContent =
    category.name;
  category_element.querySelector(".menu_category_description").textContent =
    category.description;
  category_element.querySelector(".menu_category_image img").src =
    relative_path_to_images + category.image;

  const category_button = category_element.querySelector(
    ".menu_category_button"
  );
  category_button.id = category.id + "_button";
  category_button.textContent = "Browse The Selection".toUpperCase();

  category_container.appendChild(category_element);
}

// crate a overlay for with a list of categories
function initialize_menu_categories() {
  const category_template = window.document.getElementById("category_id");
  const category_container = window.document.getElementById(
    "menu_category_container"
  );

  // clear any existing content (if needed)
  category_container.innerHTML = "";

  console.log("initialising menu categories");
  // generate categories
  object_store_menu.categories.forEach((category) =>
    process_category(category, category_template, category_container)
  );
}

// creating a list of overlays with dish list for each store category
function initialize_category_overlays() {
  console.log("initialising category overlays");
  const overlay_template = window.document.getElementById("box_overlay");
  const dish_template = window.document.getElementById("dish_item_container");
  // alert("initialising category overlays");

  object_store_menu.categories.forEach((category) => {
    // clone the overlay template for the current category
    const category_overlay = overlay_template.cloneNode(true);
    category_overlay.id = `box_overlay_${category.id}`; //unique ID for each overlay

    category_overlay.querySelector(".box_header_text").textContent =
      category.name;

    // here will be adding dishes
    const box_content = category_overlay.querySelector(".box_content");

    // initialize
    box_content.innerHTML = "";

    // add dishes
    category.dishes.forEach((dish) => {
      // console.log("category:", box_content.innerHTML);
      // console.log("dish:", dish);
      // clone the dish item template for each dish in the category
      const dish_item = dish_template.cloneNode(true);
      dish_item.id = `dish_${dish.id}`; // unique id for each dish item
      dish_item.style.display = "flex"; // ensure the dish item is visible

      dish_item.querySelector(".dish_item_heading").textContent = dish.name;
      dish_item.querySelector(".dish_item_description").textContent =
        dish.description;
      dish_item.querySelector(
        ".dish_item_price"
      ).textContent = `$${dish.price.toFixed(2)}`;
      dish_item.querySelector(".dish_image_container img").src =
        relative_path_to_images + dish.image;

      // console.log("dish_item:", dish_item);

      // add to cart button with dish id
      const add_to_cart_button = dish_item.querySelector("#cart_dish");
      // console.log("add_to_cart_button:", add_to_cart_button);
      add_to_cart_button.id = `add_${dish.id}`;
      console.log("add_to_cart_button:", add_to_cart_button);

      // append dish item to the category box
      box_content.appendChild(dish_item);
    });

    // append overlay to body
    document.body.appendChild(category_overlay);
    category_overlay.addEventListener("click", handle_overlay_click);
    // keep hidden for now
    category_overlay.style.display = "none";
  });

  console.log("end initialising category overlays");
}

function update_cart_html() {
  // get cart data from local storage and parse it
  const cart_data = JSON.parse(window.localStorage.getItem("store_cart"));
  let cart_count = window.localStorage.getItem("cart_count");
  cart_count = parseInt(cart_count);

  const button2 = cart_overlay.querySelector(".box_footer_button_2");
  const button3 = cart_overlay.querySelector(".box_footer_button_3");

  // if cart is empty
  if (cart_count === 0) {
    button2.style.display = "none";
    button3.style.display = "none";
    cart_content.innerHTML = '<div class="empty_cart">Empty</div>';
    return;
  }

  // action buttons
  button2.style.display = "inline-block";
  button3.style.display = "inline-block";

  // init current cart content and subtotal
  cart_content.innerHTML = "";
  let cart_subtotal = 0;

  // clone cart data and sort by dish_id alphabetically a-b
  // this way categories will be sorted as well
  const sorted_cart = [...cart_data].sort((a, b) =>
    a.dish_id.localeCompare(b.dish_id)
  );

  let current_category = null;
  let category_table = "";

  sorted_cart.forEach((item) => {
    const dish = object_store_menu
      .get_all_dishes()
      .find((d) => d.id === item.dish_id);
    const category = object_store_menu.get_category_by_dish_id(item.dish_id);

    // if category changes, close the previous category table and start a new one
    if (!current_category || category.id !== current_category.id) {
      if (current_category) {
        category_table += "</tbody></table></div>";
        cart_content.innerHTML += category_table;
      }
      current_category = category;
      category_table = `
        <div class="cart_table_container">
          <table class="bag_category_table">
            <thead class="bag_category_head">
              <tr><th colspan="7" class="bag_category_header">${category.name}</th></tr>
            </thead>
            <tbody>
      `;
    }

    // update subtotal
    const item_total = dish.price * item.quantity;
    cart_subtotal += item_total;

    // row item
    category_table += `
      <tr>
        <td class="bag_remove_column"><button class="bag_remove_button" data-dish-id="remove_${
          item.dish_id
        }">X</button></td>
        <td class="bag_dish_name">${dish.nickname}</td>
        <td class="bag_dish_price">$${dish.price.toFixed(2)}</td>
        <td class="bag_dish_controls">
        <button class="bag_sub_button" data-dish-id="sub_${
          item.dish_id
        }">-</button></td>
        <td class="bag_dish_qty">${item.quantity}</td>
        <td class="bag_dish_controls">
          <button class="bag_add_button" data-dish-id="add_${
            item.dish_id
          }">+</button>
        </td>
        <td class="bag_dish_total">$${item_total.toFixed(2)}</td>
      </tr>
    `;
  });

  // append table
  if (current_category) {
    category_table += "</tbody></table></div>";
    cart_content.innerHTML += category_table;
  }

  const tax = cart_subtotal * 0.15;
  const order_total = cart_subtotal + tax;

  cart_content.innerHTML += `
    <div class="bag_summary">
      <table>
        <tr><td>Subtotal:</td><td>$${cart_subtotal.toFixed(2)}</td></tr>
        <tr><td>Tax (15%):</td><td>$${tax.toFixed(2)}</td></tr>
        <tr><td>Total:</td><td>$${order_total.toFixed(2)}</td></tr>
      </table>
    </div>
  `;

  // save into global variable for checkout
  order_totals = [cart_subtotal, tax, order_total];
}

// very simplistic validation
function validate_checkout_form() {
  let is_valid = true;

  const name_field = checkout_content.querySelector("#order_name");
  const tel_field = checkout_content.querySelector("#order_tel");
  const email_field = checkout_content.querySelector("#order_email");
  const cc_field = checkout_content.querySelector("#order_credit_card");
  const exp_field = checkout_content.querySelector("#order_exp");
  const cvv_field = checkout_content.querySelector("#order_cvv");

  const name_regex = /^[a-zA-Z\s'.,]+$/;
  const tel_regex = /^(\d{3}-\d{3}-\d{4}|\d{10})$/;
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cc_regex = /^(\d{4}[-\s]?){3}\d{4}$/;
  const exp_regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  const cvv_regex = /^\d{3}$/;

  if (!name_regex.test(name_field.value)) {
    name_field.classList.add("order_error");
    is_valid = false;
  } else {
    name_field.classList.remove("order_error");
  }

  if (!tel_regex.test(tel_field.value)) {
    tel_field.classList.add("order_error");
    is_valid = false;
  } else {
    tel_field.classList.remove("order_error");
  }

  if (!email_regex.test(email_field.value)) {
    email_field.classList.add("order_error");
    is_valid = false;
  } else {
    email_field.classList.remove("order_error");
  }

  if (!cc_regex.test(cc_field.value)) {
    cc_field.classList.add("order_error");
    is_valid = false;
  } else {
    cc_field.classList.remove("order_error");
  }

  if (!exp_regex.test(exp_field.value)) {
    exp_field.classList.add("order_error");
    is_valid = false;
  } else {
    exp_field.classList.remove("order_error");
  }

  if (!cvv_regex.test(cvv_field.value)) {
    cvv_field.classList.add("order_error");
    is_valid = false;
  } else {
    cvv_field.classList.remove("order_error");
  }

  return is_valid;
}

// clear checkout form
function clear_checkout_form() {
  checkout_content.querySelector("#order_name").value = "";
  checkout_content.querySelector("#order_tel").value = "";
  checkout_content.querySelector("#order_email").value = "";
  checkout_content.querySelector("#order_credit_card").value = "";
  checkout_content.querySelector("#order_exp").value = "";
  checkout_content.querySelector("#order_cvv").value = "";
  checkout_content.querySelector("#order_comments").value = "";

  // clear errors
  checkout_content.querySelectorAll(".order_error").forEach((field) => {
    field.classList.remove("order_error");
  });

  // or like this
  // const fields = checkout_content.querySelectorAll("input, textarea");
  // fields.forEach(field => field.value = "");
}

function checkout_click(event) {
  event.preventDefault();
  console.log("place order button clicked");

  // clear forms button clicked
  if (event.target.classList.contains("box_footer_button_2")) {
    console.log("clear forms button clicked");
    clear_checkout_form();
    return;
  }

  // place order button clicked, do validations
  if (event.target.classList.contains("box_footer_button_3")) {
    console.log("place order button clicked");

    // calidate fields, check if all ok
    const form_is_valid = validate_checkout_form();

    // if not valid, show error message and return
    if (!form_is_valid) {
      show_status_message("Correct errors", true);
      return;
    }

    // generate random order number
    const order_number = "BEACON_" + Math.floor(1000 + Math.random() * 9000);

    // customer info
    const customer_info = {
      name: checkout_content.querySelector("#order_name").value,
      tel: checkout_content.querySelector("#order_tel").value,
      email: checkout_content.querySelector("#order_email").value,
      credit_card:
        checkout_content.querySelector("#order_credit_card")?.value || "",
      exp: checkout_content.querySelector("#order_exp").value,
      cvv: checkout_content.querySelector("#order_cvv").value,
      comments: checkout_content.querySelector("#order_comments").value,
    };

    //order data
    const cart_data =
      JSON.parse(window.localStorage.getItem("store_cart")) || [];

    // create order details object
    const order_details = {
      order_number,
      date: new Date().toLocaleString(),
      items: cart_data,
      totals: {
        subtotal: order_totals[0],
        tax: order_totals[1],
        total: order_totals[2],
      },
      customer_info,
    };

    // push to local storage
    const orders = JSON.parse(window.localStorage.getItem("orders")) || [];
    orders.push(order_details);
    window.localStorage.setItem("orders", JSON.stringify(orders));

    // success
    object_store_cart.clear_cart();
    update_cart_html();
    clear_checkout_form();
    checkout_overlay.querySelector(".box_footer_button_1").innerText = "CLOSE";
    checkout_overlay.querySelector(".box_footer_button_2").style.display =
      "none";
    checkout_overlay.querySelector(".box_footer_button_3").style.display =
      "none";
    checkout_content.innerHTML = `<div class="order_done"><p>ORDER ${order_number}</p><p>WAS SAVED!</p></div>`;
    return;
  } else if (
    event.target.classList.contains("box_footer_button_1") ||
    event.target.classList.contains("box_close_img")
  ) {
    console.log("go back button clicked");
    checkout_overlay.style.display = "none";
    shadow_overlay_div.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

function initialize_cart_html() {
  console.log("initialising cart overlay");
  const overlay_template = window.document.getElementById("box_overlay");
  cart_overlay = overlay_template.cloneNode(true);
  cart_overlay.id = "shopping_cart";
  cart_overlay.querySelector(".box_header_text").textContent = "SHOPPING BAG";

  // reference to the content for generating inner cart content
  cart_content = cart_overlay.querySelector(".box_content");

  cart_overlay.style.display = "none";
  document.body.appendChild(cart_overlay);
  cart_overlay.addEventListener("click", handle_cart_click);

  update_cart_html();
}

function initialize_checkout() {
  console.log("initialising checkout overlay");
  const overlay_template = window.document.getElementById("box_overlay");
  checkout_overlay = overlay_template.cloneNode(true);
  checkout_overlay.id = "checkout_overlay";
  checkout_overlay.querySelector(".box_header_text").textContent = "CHECKOUT";
  // reference to the content for generating inner cart content
  checkout_content = checkout_overlay.querySelector(".box_content");

  checkout_content.innerHTML =
    document.getElementById("checkout_container").innerHTML;

  place_order_button = checkout_overlay.querySelector("#box_footer_button_2");
  place_order_button.innerText = "CLEAR";
  place_order_button.style.removeProperty("display");

  place_order_button = checkout_overlay.querySelector("#box_footer_button_3");
  place_order_button.innerText = "ORDER";
  place_order_button.style.removeProperty("display");

  // keep hidden for now
  checkout_overlay.style.display = "none";
  document.body.appendChild(checkout_overlay);
  checkout_overlay.addEventListener("click", checkout_click);
}

async function initialize_store_and_menu(json_url) {
  await object_store_menu.initialize_from_json(json_url);
  initialize_menu_categories();
  initialize_category_overlays();
  window.object_store_cart = new store_cart();
  initialize_cart_html();
  initialize_checkout();
}

//togle display object on and off
function toggle_object_display(object, display_value = "block") {
  //for some reason doesn't work reliably
  // object.style.display =
  // object.style.display === "none" || object.style.display === ""
  // ? display_value
  // : "none";
  object.style.display = display_value;
}

function show_status_message(message, is_error = false) {
  const active_overlay = document.querySelector(
    ".box_overlay:not([style*='display: none'])"
  );
  const header = active_overlay?.querySelector(".box_header");

  if (header) {
    const status_message = document.createElement("div");
    status_message.className = is_error
      ? "status_message error_message"
      : "status_message";
    status_message.textContent = message;
    header.appendChild(status_message);

    setTimeout(() => {
      status_message.remove();
    }, 2000);
  }
}

function add_to_cart(dish_id) {
  console.log("adding dish to cart:", dish_id);
  let cart_count = window.localStorage.getItem("cart_count");
  cart_count = parseInt(cart_count);
  if (cart_count === 99) {
    show_status_message("Bag is Full!", true);
    return;
  }
  cart_count += 1;
  window.localStorage.setItem("cart_count", cart_count);
  update_cart_count();
  show_status_message("Dish added to cart!");
}

function handle_overlay_click(event) {
  // figure out which overlay (current target from event)
  const category_overlay = event.currentTarget;

  console.log("overlay clicked:", category_overlay.id);
  console.log("classlist clicked:", event.target.classList);

  // check if the add_dish_to_cart button was clicked
  if (event.target.classList.contains("add_dish_to_cart")) {
    const button_id = event.target.id;
    const dish_id = button_id.replace("add_", "");
    console.log(`adding dish with id ${dish_id} to cart`);
    object_store_cart.add_dish(dish_id);

    // if first button clicked
  } else if (
    event.target.classList.contains("box_footer_button_1") ||
    event.target.classList.contains("box_close_img")
  ) {
    console.log("go back button clicked");
    category_overlay.style.display = "none";
    shadow_overlay_div.style.display = "none";
    // enable scrolling
    document.body.style.overflow = "auto";
  }
}

function handle_cart_click(event) {
  const target = event.target;

  // extract dish_id (if it exists) from the clicked element
  // if doesn't exist, return undefined
  // mainly for debuggine purposes
  const dish_id_parts = target.dataset.dishId?.split("_");
  const dish_id =
    dish_id_parts && dish_id_parts.length >= 5
      ? dish_id_parts.slice(1).join("_")
      : null;

  console.log("dish_id:", dish_id);

  if (dish_id && target.classList.contains("bag_remove_button")) {
    // bag remove button clicked
    // if first button clicked
    object_store_cart.remove_dish(dish_id);
    show_status_message("Removed");
    update_cart_html();
  } else if (dish_id && target.classList.contains("bag_add_button")) {
    object_store_cart.add_dish(dish_id, 1);
    // show_status_message("Added one more to cart");
    update_cart_html();
  } else if (dish_id && target.classList.contains("bag_sub_button")) {
    const current_quantity = object_store_cart
      .get_all_items()
      .find((item) => item.dish_id === dish_id)?.quantity;
    if (current_quantity > 1) {
      object_store_cart.add_dish(dish_id, -1);
      // show_status_message("Added one more to cart");
      update_cart_html();
    }
  } else if (event.target.classList.contains("box_footer_button_2")) {
    //clear cart button clicked
    object_store_cart.clear_cart();
    show_status_message("Cleared");
    console.log("clear cart button clicked");
    update_cart_html();
  } else if (event.target.classList.contains("box_footer_button_3")) {
    //checkout button clicked
    console.log("checkout cart button clicked");
    cart_overlay.style.display = "none"; // Hide the overlay

    checkout_content.querySelector(
      "#bag_subtotal"
    ).innerText = `$${order_totals[0].toFixed(2)}`;
    checkout_content.querySelector(
      "#bag_tax"
    ).innerText = `$${order_totals[1].toFixed(2)}`;
    checkout_content.querySelector(
      "#bag_total"
    ).innerText = `$${order_totals[2].toFixed(2)}`;
    //checkout_overlay.scrollTop = 0;
    checkout_overlay.style.display = "block";
    checkout_overlay.scrollTop = 0;
  } else if (
    event.target.classList.contains("box_footer_button_1") ||
    event.target.classList.contains("box_close_img")
  ) {
    console.log("go back button clicked");
    cart_overlay.style.display = "none";
    shadow_overlay_div.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

function handle_menu_link_click(event) {
  event.preventDefault();
  if (current_state_selection != state_menu) {
    console.log("menu link clicked");
    main_content_scroll_position = window.scrollY;
    console.log(
      "saved main_content_scroll_position:",
      main_content_scroll_position
    );
    current_state_selection = state_menu;
    toggle_object_display(main_content_div, "none");
    toggle_object_display(menu_content_div);
    console.log(
      "restoring menu_content_scroll_position:",
      menu_content_scroll_position
    );
    window.scrollTo(0, menu_content_scroll_position);
  }
}

function handle_welcome_link_click(event) {
  event.preventDefault();

  if (current_state_selection != state_welcome) {
    console.log("welcome link clicked");
    menu_content_scroll_position = window.scrollY;
    console.log(
      "saved menu_content_scroll_position:",
      menu_content_scroll_position
    );
    current_state_selection = state_welcome;
    toggle_object_display(menu_content_div, "none");
    toggle_object_display(main_content_div, "grid");
    // toggle_object_display(main_content_div, "block");
    console.log(
      "restoring main_content_scroll_position:",
      main_content_scroll_position
    );
    window.scrollTo(0, main_content_scroll_position);
  }
}

function handle_category_button_click(event) {
  // for debugging purposes
  // will clean up for production code, these if statements are not really needed
  if (window.getComputedStyle(menu_category_container).display === "none") {
    console.log("mouse click over category div, but it is hidden");
    return;
  }
  console.log("mouse click over category div");
  event.preventDefault();

  // i do if just in case, for debuffing, it is not really needed
  if (event.target.classList.contains("menu_category_button")) {
    const button_id = event.target.id;
    //extract category id from button id
    const category_id = button_id.replace("_button", "");

    console.log(`category ${category_id} clicked.`);

    const category_object = object_store_menu.get_category_by_id(category_id);
    if (category_object) {
      console.log("Category found:", category_object);
      display_category_dish_selection(category_object);
    }
  }
}

function handle_bag_link_click(event) {
  // alert("shopping cart link clicked");
  event.preventDefault();
  console.log("cart button clicked");
  document.body.style.overflow = "hidden";
  shadow_overlay_div.style.display = "block";
  update_cart_html();
  cart_overlay.style.display = "block";
  cart_overlay.scrollTop = 0;
}

function display_category_dish_selection(category) {
  console.log(
    "Displaying category dish selection for category:",
    category.get_category_id()
  );

  // or set to "auto" to enable scrolling
  document.body.style.overflow = "hidden";
  const current_overlay = document.getElementById(`box_overlay_${category.id}`);
  if (current_overlay) {
    shadow_overlay_div.style.display = "block";
    current_overlay.style.display = "flex";
    // maybe flex;
  } else {
    console.error(`Overlay for category ${category.id} not found.`);
  }

  // box_overlay_div.style.display = "flex";
}

//initialize current menu selection
const relative_path_to_images = "./food/";
const json_url = "./menu.json";
const state_welcome = "welcome";
const state_menu = "menu";
const state_cart = "cart";
const sub_state_dishes = "dishes";
const sub_state_off = "off";

//defining cart details overlay globally
let cart_overlay, cart_content;
let checkout_overlay, checkout_content;
let order_totals = [];

let current_state_selection = state_welcome;
let current_sub_state_selection = sub_state_off;
let main_content_scroll_position = 0;
let menu_content_scroll_position = 0;

const object_store_menu = new store_menu();
window.document.addEventListener("DOMContentLoaded", () => {
  initialize_store_and_menu(json_url);
});

const menu_content_div = window.document.getElementById("menu_content");
const main_content_div = window.document.getElementById("main_content");
const menu_category_container = document.getElementById(
  "menu_category_container"
);
const shadow_overlay_div = window.document.getElementById("shadow_overlay");
const box_overlay_div = window.document.getElementById("box_overlay");

window.document
  .querySelector("#nav_beacon a")
  .addEventListener("click", handle_welcome_link_click);
window.document
  .querySelector("#nav_menu a")
  .addEventListener("click", handle_menu_link_click);
window.document
  .querySelector("#nav_bag a")
  .addEventListener("click", handle_bag_link_click);

menu_category_container.addEventListener("click", handle_category_button_click);
