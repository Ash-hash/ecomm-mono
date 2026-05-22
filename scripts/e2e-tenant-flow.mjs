const API = process.env.API_URL ?? 'http://localhost:3000/api';

function cookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

function mergeCookies(cookies, headers) {
  const setCookie = headers.getSetCookie?.() ?? [];
  for (const raw of setCookie) {
    const [pair] = raw.split(';');
    const index = pair.indexOf('=');
    if (index > 0) cookies[pair.slice(0, index)] = pair.slice(index + 1);
  }
}

async function request(path, options = {}, jar = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers ?? {}),
  };
  if (Object.keys(jar).length) headers.Cookie = cookieHeader(jar);

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  });
  mergeCookies(jar, res.headers);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const message = json?.message || `${res.status} ${res.statusText}`;
    const error = new Error(`${options.method ?? 'GET'} ${path}: ${message}`);
    error.status = res.status;
    error.body = json;
    throw error;
  }
  return json;
}

function pickData(response) {
  return response?.data ?? response;
}

async function main() {
  const stamp = Date.now().toString(36);
  const slug = `test-${stamp}`;
  const adminJar = {};
  const tenantLoginJar = {};
  const customerJar = {};
  const tenantHeader = { 'x-tenant-slug': slug };

  console.log(`Testing tenant flow for ${slug}`);

  const tenantResponse = await request(
    '/tenants/register',
    {
      method: 'POST',
      body: {
        storeName: `Codex Test Store ${stamp}`,
        slug,
        ownerName: 'Codex Owner',
        ownerEmail: `owner-${stamp}@example.com`,
        ownerPhone: '+919999999999',
        password: 'AdminPass123',
        plan: 'starter',
        billingCycle: 'monthly',
      },
    },
    adminJar,
  );
  const tenant = pickData(tenantResponse).tenant;
  if (tenant.slug !== slug) throw new Error('Tenant slug mismatch');
  console.log('✓ tenant created');

  await request(
    '/tenant/auth/login',
    {
      method: 'POST',
      headers: tenantHeader,
      body: {
        email: `owner-${stamp}@example.com`,
        password: 'AdminPass123',
      },
    },
    tenantLoginJar,
  );
  console.log('✓ tenant admin login verified');

  const parentCategory = pickData(
    await request(
      '/categories',
      {
        method: 'POST',
        headers: tenantHeader,
        body: {
          name: 'Test Apparel',
          slug: `test-apparel-${stamp}`,
          isActive: true,
          isNavBarEnable: true,
          sortOrder: 1,
        },
      },
      adminJar,
    ),
  );
  console.log('✓ category created');

  const childCategory = pickData(
    await request(
      '/categories',
      {
        method: 'POST',
        headers: tenantHeader,
        body: {
          name: 'Test Shirts',
          slug: `test-shirts-${stamp}`,
          parentId: parentCategory._id,
          isActive: true,
          isNavBarEnable: true,
          sortOrder: 2,
        },
      },
      adminJar,
    ),
  );
  console.log('✓ subcategory created');

  const product = pickData(
    await request(
      '/products',
      {
        method: 'POST',
        headers: tenantHeader,
        body: {
          name: `Test Cotton Shirt ${stamp}`,
          sku: `SKU-${stamp}`.toUpperCase(),
          description: 'End-to-end test product',
          categoryId: childCategory._id,
          price: 799,
          compareAtPrice: 999,
          cost: 300,
          stock: 25,
          status: 'active',
          featured: true,
          main_image: '/uploads/test-shirt.png',
          images: ['/uploads/test-shirt.png'],
          tags: ['test', 'shirt'],
        },
      },
      adminJar,
    ),
  );
  if (!product._id || !product.slug) throw new Error('Product create returned no id/slug');
  console.log('✓ product created');

  const catalogProducts = pickData(
    await request(`/catalog/products?limit=10`, { headers: tenantHeader }),
  );
  const catalogProductRows = Array.isArray(catalogProducts)
    ? catalogProducts
    : catalogProducts.data ?? [];
  if (!catalogProductRows.some((p) => p._id === product._id)) {
    throw new Error('Product missing from storefront catalog');
  }
  await request(`/catalog/products/${product.slug}`, { headers: tenantHeader });
  await request(`/catalog/products/${product._id}`, { headers: tenantHeader });
  await request('/catalog/products/featured?limit=8', { headers: tenantHeader });
  const filteredProducts = pickData(
    await request(`/catalog/products?category=${childCategory.slug}&limit=10`, {
      headers: tenantHeader,
    }),
  );
  const filteredRows = Array.isArray(filteredProducts)
    ? filteredProducts
    : filteredProducts.data ?? [];
  if (!filteredRows.some((p) => p._id === product._id)) {
    throw new Error('Product missing from category-filtered storefront catalog');
  }
  const categoryTree = pickData(await request('/catalog/categories', { headers: tenantHeader }));
  if (!categoryTree.some((cat) => cat._id === parentCategory._id && cat.children?.length)) {
    throw new Error('Storefront categories were not returned as a tree');
  }
  console.log('✓ storefront catalog verified');

  await request(
    '/auth/request-otp',
    {
      method: 'POST',
      headers: tenantHeader,
      body: { phone: '+918888888888' },
    },
    customerJar,
  );
  const otpResponse = pickData(
    await request(
      '/auth/verify-otp',
      {
        method: 'POST',
        headers: tenantHeader,
        body: { phone: '+918888888888', otp: '123456' },
      },
      customerJar,
    ),
  );
  if (otpResponse.isNewUser) {
    await request(
      '/auth/complete-registration',
      {
        method: 'POST',
        headers: tenantHeader,
        body: {
          registrationToken: otpResponse.registrationToken,
          name: 'Codex Customer',
          email: `customer-${stamp}@example.com`,
        },
      },
      customerJar,
    );
  }
  console.log('✓ storefront user registered/logged in');

  await request(
    '/customer/wishlist/items',
    {
      method: 'POST',
      headers: tenantHeader,
      body: { productId: product._id },
    },
    customerJar,
  );
  const wishlist = pickData(
    await request('/customer/wishlist', { headers: tenantHeader }, customerJar),
  );
  if (!wishlist.some((p) => p._id === product._id)) {
    throw new Error('Product missing from wishlist');
  }
  console.log('✓ wishlist verified');

  await request(
    '/customer/cart/items',
    {
      method: 'POST',
      headers: tenantHeader,
      body: { productId: product._id, quantity: 2 },
    },
    customerJar,
  );
  const cart = pickData(
    await request('/customer/cart', { headers: tenantHeader }, customerJar),
  );
  if (!cart.items?.some((item) => item.productId === product._id)) {
    throw new Error('Product missing from cart');
  }
  await request(
    '/customer/cart/items/selection',
    {
      method: 'PATCH',
      headers: tenantHeader,
      body: { productIds: [product._id], selected: true },
    },
    customerJar,
  );
  console.log('✓ cart verified');

  await request(
    '/customer/addresses',
    {
      method: 'POST',
      headers: tenantHeader,
      body: {
        label: 'home',
        fullName: 'Codex Customer',
        phone: '+918888888888',
        addressLine1: 'Test House',
        addressLine2: 'Test Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India',
        isDefault: true,
      },
    },
    customerJar,
  );
  console.log('✓ address created');

  const order = pickData(
    await request(
      '/customer/orders',
      {
        method: 'POST',
        headers: tenantHeader,
        body: {
          selectedProductIds: [product._id],
          shippingAddress: {
            label: 'home',
            fullName: 'Codex Customer',
            phone: '+918888888888',
            addressLine1: 'Test House',
            addressLine2: 'Test Street',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
            country: 'India',
          },
          paymentMethod: 'cod',
          notes: 'E2E test order',
        },
      },
      customerJar,
    ),
  );
  if (!order.orderId || !order.orderNumber) throw new Error('Order was not created');
  console.log(`✓ order placed: ${order.orderNumber}`);

  const orders = await request('/customer/orders', { headers: tenantHeader }, customerJar);
  const orderRows = pickData(orders);
  const orderList = Array.isArray(orderRows) ? orderRows : orderRows.data ?? [];
  if (!orderList.some((item) => item._id === order.orderId)) {
    throw new Error('Order missing from customer orders');
  }
  console.log('✓ customer orders verified');

  const dashboardStats = pickData(
    await request('/tenant/dashboard/stats', { headers: tenantHeader }, tenantLoginJar),
  );
  if (!dashboardStats?.revenue || !Array.isArray(dashboardStats.recentOrders)) {
    throw new Error('Tenant dashboard stats returned invalid shape');
  }
  console.log('✓ tenant dashboard stats verified');

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenantSlug: slug,
        categoryId: parentCategory._id,
        subCategoryId: childCategory._id,
        productId: product._id,
        productSlug: product.slug,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  if (error.body) console.error(JSON.stringify(error.body, null, 2));
  process.exitCode = 1;
});
