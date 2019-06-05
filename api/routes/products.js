//lec2
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/product');
const multer = require('multer');
const checkAuth = require('../middleware/check-auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './upload');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  //reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});
//multer alternative for body-parser, for things which body-parser cannot do.

router.get('/', (req, res, next) => {
  //returning all product
  //find results all product after find we can write query()/limit() etc.
  Product.find()
    .select('name price _id productImage')
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
        products: docs.map(doc => {
          return {
            name: doc.name,
            price: doc.price,
            productImage: doc.productImage,
            _id: doc._id,
            request: {
              type: 'GET',
              url: 'http://localhost:3000/products/' + doc._id
            }
          }
        })
      }
      //if(docs.length>=0){
      res.status(200).json(response);
      //}
      //else{
      //   res.status(404).json({
      //     message : 'No entries found'
      //   });
      // }
    }).catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });

    });
});
//order of middleware will matter
router.post('/', checkAuth, upload.single('productImage'), (req, res, next) => {
  console.log(req.file);
  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
    productImage: req.file.path
  });
  product.save().then(result => {
      console.log(result);
      res.status(201).json({
        message: 'Created product',
        createdProduct: {
          name: result.name,
          price: result.price,
          _id: result.id,
          request: {
            type: 'GET',
            url: 'http://localhost:3000/products/' + result._id
          }
        }
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });

});

router.get('/:productId', (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id).select('name price _id')
    .exec()
    .then(doc => {
      //you reach here when mongoose finds if it is valid objectId but though data may not be found, so doc will be null if data not found for that id.
      console.log("From database", doc);
      if (doc) {
        res.status(200).json({
          product: doc,
          request: {
            type: 'GET',
            description: 'Get all products',
            url: 'http://localhost:3000/products'
          }
        });
      } else {
        res.status(404).json({
          message: 'No valid entry found for provided ID'
        })
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
  //res.status after catch is not proper bcoz promises run ascyncly this would simply mean that i run code immediately before that response is there bcoz code at this line will not wait for above code to finish so instead response in then block.
});

router.patch('/:productId', checkAuth, (req, res, next) => {
  const id = req.params.productId;
  const updateOps = {};
  // [
  //{
  //   "propName": "name",
  //   "value": "Harry Potter 6"
  // }
  //]
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }
  Product.update({
      _id: id
    }, {
      $set: updateOps
    }).exec()
    .then(result => {
      console.log(result);
      res.status(200).json({
        message: 'Product Updated!',
        request: {
          type: 'GET',
          url: 'http://localhost:3000/products/' + id
        }
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

router.delete('/:productId', checkAuth, (req, res, next) => {
  const id = req.params.productId;
  Product.remove({
    _id: id
  }).exec().then(result =>
    res.status(200).json({
      message: "Product Deleted",
      request: {
        type: 'POST',
        url: 'http://localhost:3000/products/',
        body: {
          name: 'String',
          price: 'Number'
        }
      }
    })
  ).catch(err => {
    console.log(err);
    res.status(500).json({
      error: err
    });
  });
});

module.exports = router;