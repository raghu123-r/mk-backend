import { z } from 'zod';
import * as userService from '../services/user.service.js';

const wishlistSchema = z.object({ body: z.object({ productId: z.string() }) });

export const getMe = async (req, res, next) => {
  try { res.json(await userService.me(req.user.id)); } catch (e) { next(e); }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const user = await userService.toggleWishlist(req.user.id, req.body.productId);
    res.json({ wishlist: user.wishlist });
  } catch (e) { next(e); }
};

export const validators = { wishlistSchema };

