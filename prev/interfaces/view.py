from abc import ABC, abstractmethod


class View(ABC):
    def __init__(self):
        pass

    @abstractmethod
    def sendQuery(self):
        pass

    @abstractmethod
    def executeFunction(self):
        pass

    @abstractmethod
    def getCell(self):
        pass

    @abstractmethod
    def getColumn(self):
        pass

    @abstractmethod
    def getRow(self):
        pass

    @abstractmethod
    def getRange(self):
        pass

    @abstractmethod
    def setCell(self):
        pass

    @abstractmethod
    def setColumn(self):
        pass

    @abstractmethod
    def setRow(self):
        pass

    @abstractmethod
    def setRange(self):
        pass
