const express = require('express');
const router = new express.Router();

const Product = require('../models/productModel');
// create the prodct
router.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body)
        await newProduct.save()
        res.status(201).send(newProduct)
    } catch (error) {
        res.status(400).send({ message: error })
    }
})

// fetch a product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id })
        if (!product) {
            res.status(404).send({ error: "Item not found" })
        }
        res.status(200).send(product)
    } catch (error) {
        res.status(400).send(error)
    }
})


// fetch all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({})
        res.status(200).send(products)
    } catch (error) {
        res.status(400).send(error)
    }
})

// update product
router.patch('/items/:id', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'description', 'category', 'price']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({ error: 'invalid updates' })
    }
    try {
        const item = await Item.findOne({ _id: req.params.id })
        if (!item) {
            return res.status(404).send()
        }
        updates.forEach((update) => item[update] = req.body[update])
        await item.save()
        res.send(item)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const deletedProducts = await Item.findOneAndDelete({ _id: req.params.id })
        if (!deletedProducts) {
            res.status(404).send({ error: "Product not found" })
        }
        res.send(deletedProducts)
    } catch (error) {
        res.status(400).send(error)
    }
})

module.exports = router