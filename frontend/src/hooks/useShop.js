import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShop } from '../store/slices/website/cmsSlice';

// Shop details from Admin > Home > Contact Us, loaded once (state.cms.shop) and shared by every component.
// Until they load (or if the request fails) the .env / placeholder values are used.

export const fullAddress = (s) => [s.address_line, s.city, s.state, s.pincode].filter(Boolean).join(', ');

export default function useShop() {
  const dispatch = useDispatch();
  const shop = useSelector((s) => s.cms.shop);

  useEffect(() => { dispatch(fetchShop()); }, [dispatch]); // no-op once loaded

  return shop;
}
