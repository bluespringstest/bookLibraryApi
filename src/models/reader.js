
module.exports = (connection, DataTypes) => {
    const schema = {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Name cannot be empty',
                },
            }
        },
            email: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                msg: 'Email cannot be empty',
            },
            isEmail: {
                msg: 'Please use a valid email address'
            },
        }
        },
        password: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'Password cannot be empty'
                },
                isLessThan8Chars(value){
                    if (value.length < 8)
                    throw new Error('Password must be longer than 8 characters')
                }
            }
        }
    };
    const ReaderModel = connection.define('Reader', schema);
    return ReaderModel;
};
