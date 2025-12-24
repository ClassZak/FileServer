import { useNavigate } from "react-router-dom";


import '../../styles/components/element/RedirectionButton.css'



function RedirectionButton({
	reference,
	title
}){
	return (
		<a href={reference} className="RedirectionButton">
			{title}
		</a>
	);
}

export default RedirectionButton;