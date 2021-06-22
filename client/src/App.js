import React, {Fragment, ButtonHTMLAttributes} from "react";
import './App.css';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    FormGroup,
    Form,
    Input,
    InputGroupAddon,
    InputGroupText,
    InputGroup,
    Container,
    Row,
    Col
} from "reactstrap";


const App = () => (
    <Fragment>
      <h1>App</h1>
        <Button
            className="my-4"
            color="primary"
            type="button"
        >
            Sign in
        </Button>
    </Fragment>
)


export default App;
