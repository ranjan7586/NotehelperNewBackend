const Product = require("../models/nodeModels");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const ApiFeature = require("../utils/apiFeatures");
const fs = require("fs");
const { uploadFile, getPreSignedUrl, deleteFile } = require('../Helpers/awsconfig');
const multer = require('multer');


const { default: slugify } = require("slugify");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware to handle file uploads
exports.uploadFiles = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'thenote', maxCount: 1 }]);

//create Product -- Admin

exports.createNotes = catchAsyncError(async (req, res, next) => {
  const { name, slug, domain, author, description } = req.body
  const image = req.files.image ? req.files.image[0] : null;
  const thenote = req.files.thenote ? req.files.thenote[0] : null;
  if (!image || !thenote || image.length === 0 || thenote.length === 0) {
    return res.status(400).send({
      success: false,
      message: "Image and note file are required",
    });
  }
  // console.log(image)
  if (image.size > 1000000 || thenote.size > 10000000) {
    return res.status(400).send({
      success: false,
      message: "Image should be less than 1MB and note should be less than 10MB",
    });
  }
  let imageUrl, noteUrl;
  if (image) {
    imageUrl = await uploadFile(image);
  }
  if (thenote) {
    noteUrl = await uploadFile(thenote);
  }
  const note = new Product({
    name,
    slug: slugify(name),
    domain,
    author,
    description,
    image: imageUrl,
    thenote: noteUrl,
  });
  await note.save();
  res.status(201).send({
    success: true,
    message: "Note Created Successfully",
    note,
  });
});


//Get All product

exports.getAllProducts = catchAsyncError(async (req, res) => {

  const productCount = await Product.countDocuments();
  const resultPerPage = 5;

  // const apiFeatures = new ApiFeature(Product.find(), req.query).search().filter().pagination(resultPerPage);
  // const notes = await apiFeatures.query;
  const notes = await Product.find({}).populate('domain').sort({ createdAt: -1 });
  let processedNotes = [];
  for (let note of notes) {
    const imageUrl = await getPreSignedUrl(note.image);
    const noteUrl = await getPreSignedUrl(note.thenote);

    processedNotes.push({
      ...note._doc,
      imageUrl,
      noteUrl
    });
  }

  res.status(200).json({
    success: true,
    notes: processedNotes,
    count: productCount
  });
});
// exports.getAllProducts = catchAsyncError(async (req, res) => {

//   const productCount = await Product.countDocuments();
//   const resultPerPage = 5;

//   // const apiFeatures = new ApiFeature(Product.find(), req.query).search().filter().pagination(resultPerPage);
//   // const notes = await apiFeatures.query;
//   const notes = await Product.find({}).populate('domain').select("-image -thenote").limit(10).sort({ createdAt: -1 })
//   res.status(200).send({
//     success: true,
//     message: "All Products",
//     notes,
//     productCount
//   });
// });


//Get Note Details

exports.getNoteDetails = catchAsyncError(async (req, res, next) => {
  const note = await Product.findById(req.params.slug);
  // const note = await Product.findOne({ slug: req.params.slug }).populate('domain').select('-image -thenote');
  if (!note) {
    return next(new ErrorHandler("Note not found", 404))
  }
  const imageUrl = await getPreSignedUrl(note.image);
  const noteUrl = await getPreSignedUrl(note.thenote);
  res.status(200).json({
    success: true,
    message: "Note is found successfully",
    note: {
      ...note._doc,
      imageUrl,
      noteUrl
    }
  });
});

//get image of note
exports.getNoteImage = catchAsyncError(async (req, res, next) => {
  const note = await Product.findById(req.params.pid).select("image")
  if (note.image.data) {
    res.set('Content-type', note.image.contentType)
    return res.status(200).send(note.image.data)
  }
})

//get note(pdf,word)

exports.getTheNote = catchAsyncError(async (req, res, next) => {
  const note = await Product.findById(req.params.pid).select("thenote")
  if (!note) {
    return res.status(404).send({
      success: false,
      message: 'Note not found',
    });
  }

  // Set appropriate headers for downloading
  res.set({
    'Content-Type': note.thenote.contentType,
    'Content-Disposition': `attachment; filename="${note.thenote.name}"`,
  });
  return res.status(200).send(note.thenote.data)

})

//update notes

// Update note details
exports.updateNotes = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const { name, slug, domain, author, description } = req.body;
  const image = req.files && req.files.image ? req.files.image[0] : null;
  const thenote = req.files && req.files.note ? req.files.thenote[0] : null;

  const note = await Product.findById(id);
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }

  if ((image && image.size > 1000000) || (thenote && thenote.size > 10000000)) {
    return res.status(400).send({
      success: false,
      message: "Image should be less than 1MB and note should be less than 10MB",
    });
  }

  let imageUrl = note.image;
  let noteUrl = note.thenote;
  // Upload new image if provided
  if (image) {
    if (imageUrl) {
      await deleteFile(imageUrl); // Delete old image if necessary
    }
    imageUrl = await uploadFile(image);
  }

  // Upload new note file if provided
  if (thenote) {
    if (noteUrl) {
      await deleteFile(noteUrl); // Delete old note file if necessary
    }
    noteUrl = await uploadFile(thenote);
  }

  note.name = name || note.name;
  note.slug = slug || slugify(name) || note.slug;
  note.domain = domain || note.domain;
  note.author = author || note.author;
  note.description = description || note.description;
  note.image = imageUrl;
  note.thenote = noteUrl;

  await note.save();

  res.status(200).json({
    success: true,
    message: "Note updated successfully",
    note,
  });
});

//delete note
// exports.deleteNotes=async(req,res,next)=>{
//     const note=await Product.findById(req.params.id);
//     if(!note){
//         return res.status(500).json({
//             success:false,
//             massage:"note not found"
//         })
//     }
//     await note.remove();
//     res.status(200).json({
//         success: true,
//         note
//     })
// }

// exports.deleteNotes = async (req, res, next) => {
//     try {
//       const note = await Product.findById(req.params.id);
//       if (!note) {
//         return res.status(500).json({
//           success: false,
//           message: "Note not found",
//         });
//       }
//       await note.remove();
//       res.status(200).json({
//         success: true,
//         note,
//       });
//     } catch (error) {
//       console.error('Error deleting note', error);
//       res.status(500).json({
//         success: false,
//         message: "An error occurred while deleting the note",
//       });
//     }
//   };

//delete notes
exports.deleteNotes = catchAsyncError(async (req, res, next) => {
  const note = await Product.findById(req.params.id);
  let noteUrl = note.thenote;
  let imageUrl = note.image;
  if (!note) {
    return next(new ErrorHandler("Note not found", 404))
  }
  await Product.deleteOne({ _id: req.params.id });
  await deleteFile(noteUrl); // Delete old note file if necessary
  await deleteFile(imageUrl); // Delete old note file if necessary


  res.status(200).json({
    success: true,
    message: "Note deleted successfully",
  });
});


// filters
exports.notesFilterDomain = catchAsyncError(async (req, res, next) => {
  const { checked } = req.body;
  let args = {}
  if (checked.length > 0) args.domain = checked
  const notes = await Product.find(args).populate('domain');
  res.status(200).send({
    success: true,
    notes
  })
})

//note count
exports.noteCount = catchAsyncError(async (req, res) => {
  const total = await Product.find({}).estimatedDocumentCount()
  res.status(200).send({
    success: true,
    total
  })
})

//note per page
exports.noteListController = catchAsyncError(async (req, res) => {
  const perPage = 9
  const page = req.params.page ? req.params.page : 1
  const notes = await Product.find({}).populate('domain').select('-image').skip((page - 1) * perPage).limit(perPage).sort({ createdAt: - 1 })
  res.status(200).send({
    success: true,
    notes
  })
})

//search note
exports.searchNoteController = catchAsyncError(async (req, res) => {
  const { keyword } = req.params
  const result = await Product.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } }
    ]
  }).select('-image')
  res.json(result);
})

//related Product Controller
exports.relatedProductController = catchAsyncError(async (req, res) => {
  const { pid, did } = req.params;
  const notes = await Product.find({ domain: did, _id: { $ne: pid } }).populate('domain').select('-image -thenote').limit(3)
  res.status(200).send({
    success: true,
    notes
  })
})