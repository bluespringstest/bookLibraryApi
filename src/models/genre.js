
module.exports = (connection, DataTypes) => {
    const schema = {
        genre: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    args: [true],
                    msg: 'genre cannot be empty',
                },
                notNull: {
                    args: [true],
                    msg: "Don't play those games",
                },
            },
        },
    };
    const GenreModel = connection.define('Genre', schema);
    return GenreModel;
};