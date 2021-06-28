// Import Firebase database
const firebase = require("../firebase/firebase.config");

// Database references
const database = firebase.database;
const booksRef = database.ref("books");
const categoriesRef = database.ref("categories");
const authorsRef = database.ref("authors");

// Storage references
const storage = firebase.storage;
const imagesRef = storage.ref("images");

const uploadImage = async (bookId, images) => {
  try {
    let authorImage = images[0];
    let bookCoverImage = images[1];

    let authorImageRefChild = imagesRef.child(`${bookId}/author`);
    let coverImageRefChild = imagesRef.child(`${bookId}/cover`);

    authorImageRefChild.put(authorImage.buffer, {
      contentType: authorImage.mimetype
    });
    coverImageRefChild.put(bookCoverImage.buffer, {
      contentType: bookCoverImage.mimetype
    });
  } catch (error) {
    console.log(error);
  }
};
const removeImage = async bookId => {
  try {
    let authorImageRefChild = imagesRef.child(`${bookId}/author`);
    let coverImageRefChild = imagesRef.child(`${bookId}/cover`);
    if (authorImageRefChild) {
      authorImageRefChild.delete();
    }
    if (coverImageRefChild) {
      coverImageRefChild.delete();
    }
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  getAll: async (req, res) => {
    booksRef
      .get()
      .then(snapshot => {
        if (snapshot.exists()) {
          const books = snapshot.val();
          // Response
          res.status(200).json(books);
        } else {
          res.status(200).json({ message: "No data available" });
        }
      })
      .catch(error => {
        res.status(500).json({ message: error });
      });
  },

  getById: async (req, res) => {
    let bookId = req.params.id;
    try {
      booksRef.child(bookId).on("value", snapshot => {
        const theBook = snapshot.val();

        // Response
        res.status(200).json(theBook);
      });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  },

  create: async (req, res) => {
    try {
      // Step 1: Adding new book to books collection
      let newBook = {
        author: req.body?.author ?? "Unknown author",
        bookName: req.body?.bookName ?? "Unknown book",
        categories: req.body?.categories ?? [],
        myReview: req.body?.myReview ?? "No review yet ...",
        releaseYear: req.body?.releaseYear ?? "Unknown release year",
        title: req.body?.title ?? "Unknown title"
      };
      let newBookRef = booksRef.push(newBook);

      // Step 2: Adding new book to each of its category
      let newBookId = newBookRef.key;
      newBook.categories.forEach(category => {
        categoriesRef.child(`${category}/${newBookId}`).set(newBook);
      });

      // Step 3: Adding new book to its author
      authorsRef.child(`${newBook.author}/${newBookId}`).set(newBook);

      // Step 4: Upload images of author and book cover
      uploadImage(newBookId, req.files);

      // Step 5: Return response
      res.status(201).json({ ID: newBookId, message: "Create successfully!" });
    } catch (error) {
      res.status(500).json({ message: error });
      console.log(error);
    }
  },

  update: async (req, res) => {
    try {
      // Step1: Update existing book in books collection
      let newBook = {
        author: req.body?.author ?? "Unknown author",
        bookName: req.body?.bookName ?? "Unknown book",
        categories: req.body?.categories ?? [],
        myReview: req.body?.myReview ?? "No review yet ...",
        releaseYear: req.body?.releaseYear ?? "Unknown release year",
        title: req.body?.title ?? "Unknown title"
      };
      let bookId = req.params.id;
      booksRef.child(bookId).update(newBook);
      console.log(newBook);
      // Step 2: Update the corresponding categories
      //    2a - Delete old categories if necessary
      categoriesRef.on("value", snapshot => {
        Object.keys(snapshot.val()).forEach(category => {
          if (newBook.categories.includes(category)) return;
          categoriesRef.child(`${category}/${bookId}`).remove();
        });
      });
      //    2b - Add new categories if exist
      newBook.categories.forEach(category => {
        categoriesRef.child(`${category}/${bookId}`).set(newBook);
      });

      // Step 3: Update the corresponding author
      //    3a - Delete old author if necessary
      authorsRef.on("value", snapshot => {
        Object.keys(snapshot.val()).forEach(author => {
          if (author == newBook.author) return;
          authorsRef.child(`${author}/${bookId}`).remove();
        });
      });
      //    3b - Add new author if necessary
      authorsRef.child(`${newBook.author}/${bookId}`).set(newBook);

      // Step 4: Update the images of author and book cover
      uploadImage(bookId, req.files);

      // Step 5: Return response
      res.status(200).json({ ID: bookId, message: "Update successfully!" });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  },

  delete: async (req, res) => {
    try {
      // Step 1: Delete existing book in books collection
      let bookId = req.params.id;
      booksRef.child(bookId).remove();

      // Step 2: Delete the corresponding categories
      categoriesRef.on("value", snapshot => {
        Object.keys(snapshot.val() ?? {}).forEach(category => {
          categoriesRef.child(`${category}/${bookId}`).remove();
        });
      });

      // Step 3: Delete the corresponding author
      authorsRef.on("value", snapshot => {
        Object.keys(snapshot.val() ?? {}).forEach(author => {
          authorsRef.child(`${author}/${bookId}`).remove();
        });
      });

      // Step 4: Delete the corresponding images
      removeImage(bookId);

      // Step 5: Return response
      res.status(200).json({ message: "Delete successfully!" });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }
};
