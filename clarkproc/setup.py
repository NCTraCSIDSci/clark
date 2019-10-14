from setuptools import find_packages, setup

setup(
    name='clark-server',
    version='0.0.1',
    author='CoVar Applied Technologies',
    author_email='griffin@covar.com',
    url='http://www.covar.com/',
    description='CLARK backend server.',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    license='',
    python_requires='>=3.7',
)
