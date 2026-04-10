import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import profileRouter from "./profile.js";
import wallRouter from "./wall.js";
import guestbookRouter from "./guestbook.js";
import blogRouter from "./blog.js";
import photosRouter from "./photos.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(wallRouter);
router.use(guestbookRouter);
router.use(blogRouter);
router.use(photosRouter);

export default router;
