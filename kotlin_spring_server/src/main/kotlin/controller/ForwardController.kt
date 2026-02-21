package org.zak.controller

import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping


@Controller
class ForwardController {
	
	@RequestMapping("/{path:^(?!api|public|assets|.*\\..*$).*$}/**")
	fun forward(request: HttpServletRequest): String {
		// Дополнительная проверка, чтобы не зациклиться
		if (request.getAttribute("javax.servlet.forward.request_uri") != null) {
			return "forward:/"
		}
		return "forward:/"
	}
}