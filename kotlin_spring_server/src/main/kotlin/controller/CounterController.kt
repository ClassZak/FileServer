package org.zak.controller

import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.slf4j.LoggerFactory

@Controller
class CounterController {

    private val logger = LoggerFactory.getLogger(CounterController::class.java)
    private var count = 0

    @GetMapping("/")
    fun index(model: Model): String {
        logger.info("Index page requested, count: $count")
        model.addAttribute("count", count)
        return "index"
    }

    @PostMapping("/increment")
    @ResponseBody
    fun increment(): Map<String, Int> {
        ++count
        logger.info("Counter incremented to: $count")
        return mapOf("count" to count)
    }
}