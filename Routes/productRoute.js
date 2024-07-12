const express=require("express");
const { requireSignIn, isAdmin } = require("../middleware/authMiddleware");
const { getAllProducts, createNotes, updateNotes, deleteNotes, getNoteDetails, getNoteImage, getTheNote, notesFilterDomain, noteCount, noteListController, searchNoteController, relatedProductController, uploadFiles } = require("../Controllers/productController");
const ExpressFormidable = require("express-formidable");
const multer = require('multer');
const router=express.Router();


//create a note
router.route("/notes/create-note").post(requireSignIn,isAdmin,uploadFiles,createNotes);
//get all notes
router.route("/notes").get(getAllProducts);
//get a single note
router.route("/notes/get-a-note/:slug").get(getNoteDetails);

router.route("/notes/:id").post(requireSignIn,isAdmin,uploadFiles,updateNotes);

//get image
router.route("/notes/note-image/:pid").get(getNoteImage);
//get note
router.route("/notes/note/:pid").get(getTheNote);

//filter notes by domian
router.route("/notes/note-filter-domain/:slug").get(notesFilterDomain);

//total count
router.route("/notes/note-count").get(noteCount);

//note per page
router.route("/notes/note-list/:page").get(noteListController);
//search note
router.route("/notes/search-note/:keyword").get(searchNoteController);
//related-product
router.route("/notes/related-notes/:pid/:did").get(relatedProductController);


module.exports=router;