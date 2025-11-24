import MainContent from "../components/MainContent";
import Footer from "../parts/Footer";
import Header from "../parts/Header";
import factory from '../assets/img/factory.png'

function HomePage(){
    return (
		<div>
			<Header />
			<MainContent>
				<div>
					<img src={factory} style={{display: "flex"}} alt="Логотип предприятия"></img>
					<h1>Файловый сервер ООО "hfghfgh"</h1>
				</div>
			</MainContent>
			<Footer />
		</div>
	);
}

export default HomePage;