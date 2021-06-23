import React from "react";
import {Fragment, useState} from "react";
import {Link} from "react-router-dom";


const Login = () => {
    const [formData, setFromData] = useState({
        email: "",
        password: "",
    })

    const { email, password,  } = formData;
    const onChange = e => setFromData({ ...formData, [e.target.name]: e.target.value})
    const onSubmit = async (e) => {
        e.preventDefault();
        console.log("ok");
    };

    return (
        <Fragment>
            <h1 className="large text-primary">Sign In</h1>
            <p className="lead"><i className="fas fa-user"></i> Sign Into Your Account</p>
            <form className="form"  onSubmit={onSubmit}>
                <div className="form-group">
                    <input type="email" placeholder="Email Address" name="email" value={email} onChange={e => onChange(e)} required/>
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Password"
                        name="password"
                        value={password} onChange={e => onChange(e)} required
                        minLength="6"
                    />
                </div>
                <input type="submit" className="btn btn-primary" value="Login"/>
            </form>
            <p className="my-1">
                Dont have an account? <Link to="/register">Sign In</Link>
            </p>
        </Fragment>
    )
}

export default Login