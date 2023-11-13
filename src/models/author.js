
module.exports = (connection, DataTypes) => {
    const schema = {
        name: {
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
    };
    const AuthorModel = connection.define('Author', schema);
    return AuthorModel;
};