import { useNavigate } from "react-router-dom";


import '../../styles/components/element/RedirectionButton.css'



function RedirectionButton({
	reference,
	title,
	className = 'DefaultButton'
}){
	return (
		<a href={reference} className={`${className} RedirectionButton`}>
			{title}
		</a>
	);
}

export default RedirectionButton;