package org.zak

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class FileserverApplication

fun main(args: Array<String>) {
    println("Sugoma!")
    runApplication<FileserverApplication>(*args)
}