import MainContent from "../components/MainContent";
import Footer from "../parts/Footer";
import Header from "../parts/Header";

function AccountPage(){
    return (
		<div>
			<Header />
			<MainContent>
				<h1>Пользователь</h1>
			</MainContent>
			<Footer />
		</div>
	);
}

export default AccountPage;