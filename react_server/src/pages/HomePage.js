import MainContent from "../components/MainContent";
import factory from '../assets/img/factory.png'

function HomePage(){
    return (
		<MainContent>
			<div>
				<img src={factory} style={{display: "flex"}} alt="Логотип предприятия"></img>
				<h1>Файловый сервер ООО "ClassZak Engine"</h1>
			</div>
		</MainContent>
	);
}

export default HomePage;