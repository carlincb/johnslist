const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        image: {
            type: String
        },
        description: {
            type: String
        },
        username: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now,
            get: d => d.toLocaleString('en-us', {year: "numeric", month: "2-digit", day: "two-digit"})
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: false
        }
    },
    {
        toJSON: {
            getters: true
        },
        id: false
    }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;