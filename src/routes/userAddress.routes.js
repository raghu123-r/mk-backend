import { Router } from 'express';
import { getAddresses, addAddress, updateAddress, deleteAddress } from '../controllers/userAddress.controller.js';
import { addAddressRules, handleValidationErrors } from '../validators/userAddress.validator.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddressRules, handleValidationErrors, addAddress);
router.patch('/addresses/:index', protect, updateAddress);
router.delete('/addresses/:index', protect, deleteAddress);

export default router;
