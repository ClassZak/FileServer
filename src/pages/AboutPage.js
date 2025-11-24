import MainContent from "../components/MainContent";
import Footer from "../parts/Footer";
import Header from "../parts/Header";

function AboutPage(){
    return (
		<div>
			<Header />
			<MainContent>
				<h1>Файловый сервер</h1>
				<p className="block-indent">
					{"\t"}Файловый сервер - это проект для централизованной работы с файлами мелких и средних предприятий.
				</p>
			</MainContent>
			<Footer />
		</div>
	);
}

export default AboutPage;