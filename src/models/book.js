
module.exports = (connection, DataTypes) => {
    const schema = {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    args: [true],
                    msg: 'title cannot be empty',
                },
                notNull: {
                    args: [true],
                    msg: "Don't play those games",
                },
            },
        },
        author: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    args: [true],
                    msg: 'author cannot be empty',
                },
                notNull: {
                    args: [true],
                    msg: "Don't play those games",
                },
            },
        },
        genre: DataTypes.STRING,
        ISBN: DataTypes.STRING
    };
    const BookModel = connection.define('Book', schema);
    return BookModel;
};