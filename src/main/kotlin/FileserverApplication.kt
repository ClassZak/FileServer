package org.zak

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.ComponentScan

@SpringBootApplication
@ComponentScan(basePackages = ["org.zak"])
class FileserverApplication

fun main(args: Array<String>) {
    runApplication<FileserverApplication>(*args)
}