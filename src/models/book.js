
module.exports = (connection, DataTypes) => {
    const schema = {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'title cannot be empty',
                },
                notNull: {
                    msg: "Don't play those games",
                },
            },
        },
        author: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'author cannot be empty',
                },
                notNull: {
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
