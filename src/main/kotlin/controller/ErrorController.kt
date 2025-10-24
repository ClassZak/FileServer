package org.zak.controller

import jakarta.servlet.http.HttpServletRequest
import org.springframework.boot.web.servlet.error.ErrorController
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Controller
class CustomErrorController : ErrorController {

    @RequestMapping("/error")
    fun handleError(request: HttpServletRequest): String {
        return "error"
    }
}