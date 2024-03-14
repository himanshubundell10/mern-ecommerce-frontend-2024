import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { VscError } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom";
import CartItemCard from "../components/cart-item";
import { addToCart, calculatePrice, discountApplied, removeCartItem } from "../redux/reducer/cartReducer";
import { server } from "../redux/store";
import { CartReducerInitialState } from "../types/reducer-types";
import { CartItem } from "../types/types";



const Cart = () => {
  const dispatch = useDispatch();

  const { cartItems, subtotal, tax, total, shippingCharges, discount } = useSelector((state: { cartReducer: CartReducerInitialState }) => state.cartReducer);

  const [coupanCode, setCoupanCode] = useState("");
  const [isValidCoupanCode, setIsValidCoupanCode] = useState<boolean>(false);

  const incrementHandler = (cartItem: CartItem) => {
    if (cartItem.quantity >= cartItem.stock) return toast.success("Max Limit Reached");
    dispatch(addToCart({ ...cartItem, quantity: cartItem.quantity + 1 }))
  };
  const decrementHandler = (cartItem: CartItem) => {
    if (cartItem.quantity <= 1) return;

    dispatch(addToCart({ ...cartItem, quantity: cartItem.quantity - 1 }))
  };
  const removeHandler = (productId: string) => {

    dispatch(removeCartItem(productId));
    return toast.success("Item Deleted Successfully")
  };

  useEffect(() => {
    const{token:cancelToken,cancel} = axios.CancelToken.source()

    const timeOutId = setTimeout(() => {
      axios
        .get(`${server}/api/v1/payment/discount?coupon=${coupanCode}`,{cancelToken})
        .then((res) => {
          dispatch(discountApplied(res.data.discount));
          setIsValidCoupanCode(true);
          dispatch(calculatePrice());
        })
        .catch(() => {
          dispatch(discountApplied(0));
          setIsValidCoupanCode(false);
          dispatch(calculatePrice());
        });

    }, 1000);

    return () => {
      clearTimeout(timeOutId);
      cancel();
      setIsValidCoupanCode(false);
    }
  }, [coupanCode])

  useEffect(() => {
    dispatch(calculatePrice())

  }, [cartItems])



  return (
    <div className='cart'>
      <main>
        {/* cart item render */}
        {cartItems.length > 0 ? cartItems.map((i, idx) => (
          <CartItemCard incrementHandler={incrementHandler} decrementHandler={decrementHandler} removeHandler={removeHandler} key={idx} cartItem={i} />
        )
        ) : <h1>No Items Added</h1>}

      </main>

      {/* aside part where all the calculation done */}
      <aside>
        <p>Subtotal: ₹{subtotal}</p>
        <p>ShippingCharges: ₹{shippingCharges}</p>
        <p>Tax: ₹{tax}</p>
        <p>Discount :<em className="red"> - ₹{discount}</em></p>
        <p><b>Total: ₹{total}</b></p>
        <input
          type="text"
          placeholder="Coupan Code"
          value={coupanCode}
          onChange={(e) => { setCoupanCode(e.target.value) }} />


        {
          coupanCode && (isValidCoupanCode ? <span className="green">₹{discount} off using the <code>{coupanCode}</code></span> :
            <span className="red">Invalid coupan<VscError /></span>)
        }


        {
          cartItems.length > 0 && <Link to="/shipping">Checkout</Link>
        }
      </aside>

    </div>
  )
}

export default Cart
