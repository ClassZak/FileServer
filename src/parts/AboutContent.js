import '../css_classes/indented.css'

function AboutContent() {
	return (
		<div>
			<h1>Файловый сервер</h1>
			<p className="block-indent">
				{"\t"}Файловый сервер - это проект для централизованной работы с файлами мелких и средних предприятий.
			</p>
		</div>
	);
}

export default AboutContent;