const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");

async function getCartAggregate(tableId) {
  const carts = await Cart.find({ table: tableId })
    .populate("customer", "name avatarUrl")
    .populate("items.menuItem", "name image price spicyLevel available")
    .sort({ updatedAt: -1 });

  const participants = carts.map((cart) => ({
    cartId: cart._id,
    customerId: cart.customer?._id || cart.guest?.id,
    name: cart.customer?.name || cart.guest?.name || "临时顾客",
    avatarUrl: cart.customer?.avatarUrl || "",
    items: cart.items.map((item) => ({
      menuItem: item.menuItem,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      remark: item.remark
    })),
    updatedAt: cart.updatedAt
  }));

  const totalAmount = participants.reduce(
    (sum, person) =>
      sum +
      person.items.reduce((itemSum, item) => itemSum + item.unitPrice * item.quantity, 0),
    0
  );

  return { participants, totalAmount };
}

async function getOrCreateCart({ table, user, guest }) {
  const query = user
    ? { table, customer: user._id }
    : { table, "guest.id": guest.id };

  return Cart.findOneAndUpdate(
    query,
    {
      $setOnInsert: {
        table,
        customer: user?._id,
        guest: user ? undefined : guest,
        items: []
      }
    },
    { new: true, upsert: true }
  );
}

async function addItemToCart({ table, user, guest, menuItemId, quantity = 1, remark = "" }) {
  const item = await MenuItem.findById(menuItemId);
  if (!item || !item.available) {
    const error = new Error("菜品不存在或已下架");
    error.statusCode = 404;
    throw error;
  }

  const cart = await getOrCreateCart({ table, user, guest });
  const existing = cart.items.find((entry) => entry.menuItem.toString() === menuItemId);
  if (existing) {
    existing.quantity += Number(quantity);
    if (remark) existing.remark = remark;
  } else {
    cart.items.push({
      menuItem: item._id,
      quantity: Number(quantity),
      unitPrice: item.price,
      remark
    });
  }
  await cart.save();
  return { cart, item };
}

module.exports = { getCartAggregate, addItemToCart, getOrCreateCart };
