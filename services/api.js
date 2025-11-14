// Use your machine's local IP - your server is running on port 8000
export const API_BASE_URL = "http://172.17.76.174:8000/api";

/**
 * @typedef {Object} CustomerPayload
 * @property {string} name
 * @property {string} address
 * @property {number|null} [latitude]
 * @property {number|null} [longitude]
 * @property {string} [orderDetails]
 * @property {string} [deliveryPerson]
 */

/**
 * @typedef {Object} Customer
 * @property {string} _id
 * @property {string} name
 * @property {string} address
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {string} [orderDetails]
 * @property {string} [deliveryPerson]
 * @property {string} status
 * @property {string} deliveryDate
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {T[]} [customers]
 * @property {T} [customer]
 * @property {string} [message]
 * @property {string} [error]
 * @property {number} [totalPages]
 * @property {number} [currentPage]
 * @property {number} [total]
 */

/**
 * Create a customer
 * @param {CustomerPayload} payload
 * @returns {Promise<ApiResponse<Customer>>}
 */
export async function createCustomer(payload) {
  const url = `${API_BASE_URL}/customers`;

  console.log("Sending request to:", url);
  console.log("Payload:", payload);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("Error response:", text);
      throw new Error(text || `Failed to create customer: ${res.status}`);
    }

    const data = await res.json();
    console.log("Success response:", data);
    return data;
  } catch (error) {
    console.error("Network error:", error);
    throw error;
  }
}

/**
 * Fetch customers
 * @param {string} [query]
 * @returns {Promise<ApiResponse<Customer>>}
 */
export async function getCustomers(query = "") {
  const url = `${API_BASE_URL}/customers${query ? `?${query}` : ""}`;

  console.log("Fetching customers from:", url);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Error response:", text);
      throw new Error(text || `Failed to fetch customers: ${res.status}`);
    }

    const data = await res.json();
    console.log("Customers response:", data);
    return data;
  } catch (error) {
    console.error("Network error:", error);
    throw error;
  }
}

// Optional: Add function to get today's orders specifically

/**
 * @returns {Promise<ApiResponse<Customer>>}
 */
export async function getTodayOrders() {
  const url = `${API_BASE_URL}/customers/today/orders`;

  console.log("Fetching today's orders from:", url);

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to fetch today's orders: ${res.status}`);
    }

    const data = await res.json();
    console.log("Today's orders response:", data);
    return data;
  } catch (error) {
    console.error("Network error:", error);
    throw error;
  }
}

/**
 * Get single customer by ID
 * @param {string} id
 * @returns {Promise<any>}
 */
export async function getCustomer(id) {
  const url = `${API_BASE_URL}/customers/${id}`;
  console.log("Fetching customer", id, "from", url);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const text = await res.text();
      console.error("Error response:", text);
      throw new Error(text || `Failed to fetch customer: ${res.status}`);
    }
    const data = await res.json();
    console.log("Customer response:", data);
    return data;
  } catch (error) {
    console.error("Network error:", error);
    throw error;
  }
}

/**
 * Update customer status
 * @param {string} id
 * @param {string} status
 * @returns {Promise<ApiResponse<Customer>>}
 */
export async function updateCustomerStatus(id, status) {
  const url = `${API_BASE_URL}/customers/${id}`;
  console.log(`Updating customer ${id} status -> ${status}`);
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Error response:", text);
      throw new Error(text || `Failed to update customer: ${res.status}`);
    }
    const data = await res.json();
    console.log("Update response:", data);
    return data;
  } catch (error) {
    console.error("Network error:", error);
    throw error;
  }
}
