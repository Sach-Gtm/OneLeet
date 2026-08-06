const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/publicController");

// PUBLIC, no-login exam exploration (the marketing "EXAMS" pages). Read-only.
router.get("/exams", ctrl.catalog);
router.get("/exams/:code/overview", ctrl.overview);
router.get("/exams/:code/pattern", ctrl.pattern);
router.get("/exams/:code/syllabus", ctrl.syllabus);
router.get("/exams/:code/seat-matrix", ctrl.seatMatrix);
router.get("/exams/:code/cutoffs", ctrl.cutoffs);
router.get("/exams/:code/pyqs", ctrl.pyqs);

module.exports = router;
