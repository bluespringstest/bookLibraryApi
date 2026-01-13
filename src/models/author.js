
module.exports = (connection, DataTypes) => {
    const schema = {
        name: {
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
    };
    const AuthorModel = connection.define('Author', schema);
    return AuthorModel;
};
