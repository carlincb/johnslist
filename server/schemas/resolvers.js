const { AuthenticationError } = require('apollo-server-express');
const { User, Product, Category, Order } = require('../models');
const { signToken } = require('../utils/auth');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const resolvers = {
    Query: {
        categories: async () => {
            return await Category.find()
        },
        category: async (parent, { name }) => {
            return await Category.findOne({ name }).populate('products');
        },
        products: async (parent, { category, name }) => {
            const params = {};

            if (category) {
                params.category = category;
            }

            if (name) {
                params.name = {
                    $regex: name,
                };
            }

            return Product.find(params).populate('category');
        },
        allProducts: async () => {
            return await Product.find();
        },
        product: async (parent, { _id }) => {
            return await Product.findOne({ _id }).populate('category');
        },
        // TODO: rename this to me
        user: async (parent, args, context) => {
            console.log(context.user)
            if (context.user) {
                console.log("---found current user ----");
                const user = await User.findById(context.user._id).populate('wishlist').populate('listedItems');
                console.log('user: ', user)
                // user.orders.sort((a, b) => b.purchaseDate - a.purchaseDate);

                return user;
            }

            throw new AuthenticationError('Not logged in');
        },
        order: async (parent, { _id }, context) => {
            if (context.user) {
                const user = await User.findById(context.user._id).populate({
                    path: 'orders.products',
                    populate: 'category'
                })
                return user.orders.id(_id)
            }
            throw new AuthenticationError('please log in')
        },
        checkout: async (parent, args, context) => {
            const url = new URL(context.headers.referer).origin;
            const order = new Order({ products: args.products });
            const items = []

            const { products } = await order.populate('products').execPopulate();

            for (let i = 0; i < products.length; i++) {
                const product = await stripe.products.create({
                    name: products[i].name,
                    description: products[i].description,
                    images: [`${url}/images/${products[i].image}`]
                })

                const price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: products[i].price,
                    currency: 'usd'
                })
                items.push({
                    price: price.id,
                    quantity: 1
                })

            }
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                items,
                mode: 'payment',
                success_url: `${url}/success?session_id={CHECKOUT_SESSION_ID}`,//pass in the checkout session id
                cancel_url: `${url}/`
            })

            return { session: session.id }
        }
    },
    Mutation: {
        addUser: async (parent, args) => {
            console.log(args);
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },

        updateUser: async (parent, args, context) => {
            if (context.user) {
                return User.findByIdAndUpdate(context.user.id, args, {
                    new: true,
                });
            }

            throw new AuthenticationError('Not logged in');
        },

        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);

            return { token, user };
        },


        addOrder: async (parent, { products }, context) => {
            console.log(context);
            if (context.user) {
                const order = new Order({ products });

                await User.findByIdAndUpdate(context.user.id, {
                    $push: { orders: order },
                });

                return order;
            }

            throw new AuthenticationError('Not logged in');
        },


        addProduct: async (parent, { _id, name, username, price, description, image, category }, context) => {
            // console.log(context.user)
            console.log
            if (context.user) {
                // console.log("---- about to create product ----")

                //add product needs to be pushed to the sell
                const product = await Product.create({ _id, name, username, price, description, image, category });

                console.log("----product----", product);

                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { listedItems: product._id } },
                    { new: true }
                );
                const updatedCategory = await Category.findByIdAndUpdate(
                    { _id: category },
                    { $addToSet: { products: product._id } },
                    { new: true }
                );
                console.log("-------category------", updatedCategory);

                return { product, updatedUser, updatedCategory };
            }
        },

        deleteProduct: async (parent, { productId }, context) => {
            if (context.user) {
                const updatedProduct = await User.findByIdAndUpdate(
                    context.user._id,
                    { $pull: { listedItems: productId } },
                    { new: true, runValidators: true }
                )
                console.log(updatedProduct);
                return updatedProduct;
            }
            return;
        },

        addWish: async (parent, { _id }, context) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },

                    { $addToSet: { wishlist: { _id: _id } } },
                    // { $addToSet: { wishlist: { productId: productId } } },
                    { new: true }
                )
                return updatedUser;
            }
            return;
        },

        deleteWish: async (parent, { productId }, context) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { wishlist: { productId: productId } } },
                    { new: true }
                )
                return updatedUser;
            }
            return;
        },
    }
};

module.exports = resolvers;
