import MainContent from "../components/MainContent";

function AboutPage(){
    return (
		<MainContent>
			<h1>Файловый сервер</h1>
			<p className="block-indent">
				{"\t"}Файловый сервер - это проект для централизованной работы с файлами мелких и средних предприятий.
				{"\n\t"}Данное решение позволяет автоматизировать работу и управлять доступом к файлам предприятия.
			</p>
		</MainContent>
	);
}

export default AboutPage;